"""
RetailFlow AI — ML Forecasting Service
Uses RandomForestRegressor from scikit-learn to predict demand.
Run: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import warnings

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

# Category encoding
CATEGORIES = [
    "Electronics", "Clothing", "Food & Beverage", "Home & Garden",
    "Sports", "Toys", "Books", "Health", "Other"
]
cat_encoder = LabelEncoder()
cat_encoder.fit(CATEGORIES)

MONTH_MAP = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
    "May": 5, "Jun": 6, "Jul": 7, "Aug": 8,
    "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
}


def build_features(sales_history, price, category, current_stock):
    """
    Build a feature matrix from the sales history.
    Each row represents one month of data with the following features:
    - month number (1-12)
    - price
    - category (encoded as int)
    - current stock
    - lag_1: sales from previous month
    - lag_2: sales from 2 months ago
    - rolling_avg_3: rolling average of last 3 months
    """
    try:
        cat_encoded = cat_encoder.transform([category])[0]
    except Exception:
        cat_encoded = 0

    sales = [entry["sales"] for entry in sales_history]
    months = [MONTH_MAP.get(entry["month"], 1) for entry in sales_history]

    X, y = [], []

    for i in range(2, len(sales)):
        lag_1 = sales[i - 1]
        lag_2 = sales[i - 2]
        rolling_avg = np.mean(sales[max(0, i - 3): i])
        month_num = months[i]

        X.append([month_num, price, cat_encoded, current_stock, lag_1, lag_2, rolling_avg])
        y.append(sales[i])

    return np.array(X), np.array(y)


def get_feature_importance(model):
    """Extract and label feature importances from the trained RF model."""
    feature_names = ["Month", "Price", "Category", "Stock Level", "Last Month Sales", "2-Month Lag", "3-Month Avg"]
    importances = model.feature_importances_

    result = sorted(
        [{"feature": name, "importance": round(float(imp), 3)} for name, imp in zip(feature_names, importances)],
        key=lambda x: x["importance"],
        reverse=True
    )
    return result


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "RetailFlow ML"})


@app.route("/forecast", methods=["POST"])
def forecast():
    data = request.get_json()

    if not data:
        return jsonify({"message": "No data provided"}), 400

    sales_history = data.get("sales_history", [])
    price = float(data.get("price", 10))
    category = data.get("category", "Other")
    current_stock = int(data.get("current_stock", 0))
    low_stock_threshold = int(data.get("low_stock_threshold", 10))
    item_name = data.get("name", "Item")

    if len(sales_history) < 3:
        return jsonify({"message": "Need at least 3 months of sales history"}), 400

    # Build features and train model
    X, y = build_features(sales_history, price, category, current_stock)

    if len(X) < 2:
        return jsonify({"message": "Insufficient data to train model"}), 400

    # Train Random Forest (simple, explainable, robust to small datasets)
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=4,
        random_state=42,
        min_samples_split=2
    )
    model.fit(X, y)

    # Predict next month's demand
    sales = [entry["sales"] for entry in sales_history]
    lag_1 = sales[-1]
    lag_2 = sales[-2]
    rolling_avg = np.mean(sales[-3:])
    next_month_num = (MONTH_MAP.get(sales_history[-1]["month"], 12) % 12) + 1

    try:
        cat_encoded = cat_encoder.transform([category])[0]
    except Exception:
        cat_encoded = 0

    next_features = np.array([[next_month_num, price, cat_encoded, current_stock, lag_1, lag_2, rolling_avg]])
    predicted_raw = model.predict(next_features)[0]
    predicted_demand = max(0, int(round(predicted_raw)))

    # Restock recommendation
    restock_qty = max(0, predicted_demand - current_stock + low_stock_threshold)

    # R² score as confidence (clamped to 0–100%)
    from sklearn.metrics import r2_score
    y_pred_train = model.predict(X)
    r2 = r2_score(y, y_pred_train)
    confidence = min(99, max(30, int(r2 * 100)))

    # Build recommendation text
    if restock_qty > 0:
        recommendation = (
            f"Based on historical trends, {item_name} is expected to sell {predicted_demand} units "
            f"next month. With {current_stock} units in stock, we recommend ordering {restock_qty} "
            f"more units to stay above the low-stock threshold of {low_stock_threshold}."
        )
    else:
        recommendation = (
            f"Stock levels look healthy. {item_name} is predicted to sell {predicted_demand} units "
            f"next month and you have {current_stock} units available — no restock needed right now."
        )

    # Build chart data: historical weeks + forecast
    monthly_sales = [entry["sales"] for entry in sales_history]
    chart_data = []
    for i, entry in enumerate(sales_history):
        chart_data.append({
            "week": entry["month"],
            "actual": entry["sales"],
            "predicted": None
        })

    # Add the forecast point
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    next_month_name = month_names[next_month_num - 1]
    chart_data.append({
        "week": f"{next_month_name} (est.)",
        "actual": None,
        "predicted": predicted_demand
    })

    # Trim to last 6 months + forecast for readability
    if len(chart_data) > 7:
        chart_data = chart_data[-7:]

    return jsonify({
        "predictedDemand": predicted_demand,
        "restockQty": restock_qty,
        "confidence": confidence,
        "recommendation": recommendation,
        "chartData": chart_data,
        "featureImportance": get_feature_importance(model),
    })


if __name__ == "__main__":
    print("RetailFlow ML Service starting on http://localhost:8000")
    app.run(host="0.0.0.0", port=8000, debug=False)

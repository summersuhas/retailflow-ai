const express = require('express')
const router = express.Router()
const inventoryController = require('../controllers/inventoryController')
const authMiddleware = require('../middleware/auth')

// All inventory routes require auth
router.use(authMiddleware)

router.get('/', inventoryController.getAll)
router.get('/:id', inventoryController.getOne)
router.post('/', inventoryController.create)
router.put('/:id', inventoryController.update)
router.delete('/:id', inventoryController.remove)

module.exports = router

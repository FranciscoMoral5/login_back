import { Router } from 'express'
import * as ingredientes from '../controllers/ingredientes.controller.js'

const router = Router()

router.get('/:id', ingredientes.detalle)
router.get('/', ingredientes.listar)

export default router

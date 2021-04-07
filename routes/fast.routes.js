const { Router } = require("express");
const { celebrate } = require("celebrate");
const { requireAuth, isAdmin } = authMiddleware;
const {createNewFast} = require('./../controllers/fast.controller')


const router = Router();

router.get("/", createNewFast)


module.exports = router;

//This combines all the route modules
import aunthentication_routes from "./authentication_routes"
import catalogRoutes from "./catalog_routes";
import publicCatalogRoutes from "./public_catalog_routes";
import questionRoutes from "./question_routes";
import coinRoutes from "./coin_routes";
import gameplayRoutes from "./gameplay_routes";
import leaderboardRoutes from "./leaderboard_routes";
import {Router} from 'express';

const router = Router();

router.use("/auth", aunthentication_routes);
router.use("/admin/catalog", catalogRoutes);
router.use("/catalog", publicCatalogRoutes);
router.use(questionRoutes);
router.use(coinRoutes);
router.use(gameplayRoutes);
router.use(leaderboardRoutes);

export default router;

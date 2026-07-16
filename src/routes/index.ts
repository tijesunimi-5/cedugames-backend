//This combines all the route modules
import aunthentication_routes from "./authentication_routes"
import catalogRoutes from "./catalog_routes";
import publicCatalogRoutes from "./public_catalog_routes";
import {Router} from 'express';

const router = Router();

router.use("/auth", aunthentication_routes);
router.use("/admin/catalog", catalogRoutes);
router.use("/catalog", publicCatalogRoutes);

export default router;

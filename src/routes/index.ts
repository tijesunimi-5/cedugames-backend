//This combines all the route modules
import aunthentication_routes from "./authentication_routes"
import catalogRoutes from "./catalog_routes";
import {Router} from 'express';

const router = Router();

router.use("/auth", aunthentication_routes);
router.use("/admin/catalog", catalogRoutes);

export default router;

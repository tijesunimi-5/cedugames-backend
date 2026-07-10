//This combines all the route modules
import aunthentication_routes from "./authentication_routes"
import {Router} from 'express';

const router = Router();

router.use("/auth", aunthentication_routes);

export default router;
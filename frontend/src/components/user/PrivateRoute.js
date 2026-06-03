import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

const PrivateRoute = ({ element }) => {
    const token = Cookies.get("access");
    console.log("Token in PrivateRoute:", token); // Debug log
    return token ? element : <Navigate to="/" />;
};

export default PrivateRoute;
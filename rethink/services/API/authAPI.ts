import { authEndpoints } from "../api";
import { callApi } from "../callAPI";

export const loginAPI = (email : string, password :  string) => {
    return callApi({
        method: "POST",
        url: authEndpoints.login,
        body:{email,password},
        showErrorToast:true,
        showSuccessToast:true,
    })  
}

export const signUpAPI = (email : string, password : string, name : string, mobile_number : string, confirm_password : string) => {
    return callApi({
        method: "POST",
        url: authEndpoints.register,
        body:{email,password,name,mobile_number,confirm_password},
        showErrorToast:true,
        showSuccessToast:true,
    })  
}

export const logoutAPI = () => {
    return callApi({
        method: "POST",
        url: authEndpoints.logout,
        showErrorToast:true,
        showSuccessToast:true,
    })  
}

export const getProfileAPI = () => {
    return callApi({
        method: "GET",
        url: authEndpoints.profile,
        showErrorToast:true,
        showSuccessToast:true,
    })  
}
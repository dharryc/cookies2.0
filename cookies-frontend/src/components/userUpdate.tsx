import apiUrl  from "./apiUrl";

type UpdateProfileData = {
    username: string;
    first_name: string;
    surname: string;
    birthday: string;
};

export default function UpdateUser(data: UpdateProfileData) {
    return fetch(`${apiUrl}/user`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
    });
}
class UserCreationdto {
    username: string;
    first_name: string;
    surname: string;
    birthdate: string;
    unhashed_password: string;

    constructor(
        username: string,
        first_name: string,
        surname: string,
        birthdate: string,
        unhashed_password: string
    ) {
        this.username = username;
        this.first_name = first_name;
        this.surname = surname;
        this.birthdate = birthdate;
        this.unhashed_password = unhashed_password;
    }
}

export default UserCreationdto;

enum CarMakerClientErrors {
    SERVER_ERROR = "server_error",
    INVALID_CREDENTIALS = "invalid_credentials",
    ACCOUNT_LOCKED = "account_locked",
    PENDING_TFA = "pending_tfa"
}

class CarMakerClient {
    // generic carmarker client

    // email adress of the account
    private readonly email: string;
    // password of the account
    private readonly password: string;
    constructor(email: string, password: string) {
        this.email = email;
        this.password = password;
    }

    getEmail = (): string => {
        return this.email;
    }

    getPassword = (): string => {
        return this.password;
    }



}

export default CarMakerClient;
export { CarMakerClientErrors };
import * as functions from "firebase-functions";
import { google } from "googleapis";

const initCors = (request: functions.https.Request, response: functions.Response<any>): void => {
    response.set("Access-Control-Allow-Origin", "*");
    if (request.method === "OPTIONS") {
        response.set("Access-Control-Allow-Methods", "GET, POST");
        response.set("Access-Control-Allow-Headers", "Content-Type");
        response.set("Access-Control-Max-Age", "3600");
        response.status(204).send("");
    }
};

const authGoogle = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
    return auth.getClient();
};

const getTargetURL = async (sourceURL: string): Promise<string> => {
    const auth = await authGoogle();

    const googleSheets = google.sheets({ version: "v4", auth: auth });
    const spreadsheetId = "1GDCLbFUH9jlETqdPfs9BSwcc5b8xNXCPrXFZFHzj4OE";

    let sheetData = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "'1'!B3:E10",
    });
    let targetURL: string = "";

    sheetData.data.values?.forEach((data) => {
        if (data.length != 4) return;

        if (data[1] === sourceURL) {
            targetURL = data[2];
            return;
        }
    });

    return targetURL;
};

export const goHimaforka = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
    initCors(request, response);

    switch (request.method) {
        case "GET":
            if (request.params[0].toString().length == 0) {
                response.redirect("https://v3.himaforka-uajy.org");
                break;
            }

            const targetURL: string = await getTargetURL(request.params[0].toString());
            switch (targetURL.length) {
                case 0:
                    response.redirect("https://v3.himaforka-uajy.org");
                    break;
                default:
                    response.redirect(targetURL);
                    break;
            }
            break;

        default:
            response.send({ status: "error" });
            break;
    }
});

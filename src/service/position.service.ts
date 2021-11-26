import { ServiceUnit } from "@src/functions/service-unit-packer";
import { installRouter } from "@src/functions/setup-router";
import { RequestHandler, Request, Response, NextFunction, } from "express";
import { json, json as parserJson } from "body-parser";
import { loginProtect } from "@src/middleware/login-protect.middleware";
import { getGlobalPlugin } from "@src/bootstrap";
import superagent from "superagent";
import { HttpPackage, HttpPackageCode } from "@src/class/http-package.class";
import { gaoDeSdkApiKey } from "@src/config/gaode-map-sdk.config";
import { locationToPos } from "@src/functions/location";
import { GeographicCMarkBase, GeographicCoordinateMark } from "@src/model/geographic-coordinate-mark.model";

const globalPlugin = getGlobalPlugin();

interface InputReverseGeocoding {
    location: string
}

interface ResultReverseGeocoding {
    address: GeographicCMarkBase[],
}


const reverseGeocoding = ServiceUnit<InputReverseGeocoding, ResultReverseGeocoding, InputReverseGeocoding>(async (options) => {

    const getLocal = await superagent.get("https://restapi.amap.com/v3/geocode/regeo").query({
        "key": gaoDeSdkApiKey,
        "extensions": "all",
        "location": options.location,
    });

    const resultData = getLocal.body as Record<string, any>;

    if (resultData["status"] == "1") {
        const regeocode = resultData["regeocode"];
        const addressComponent = regeocode["addressComponent"] as Record<string, any>;
        const city = addressComponent["city"];
        const province = addressComponent["province"];
        const district = addressComponent["district"];
        const street = addressComponent["streetNumber"]["street"];
        const country = addressComponent["country"];
        const township = addressComponent["township"];
        const pois = Array.from<Record<string, any>>(regeocode["pois"]);
        const geographicCoordinateMarks: GeographicCoordinateMark[] = [];
        pois.sort((a, b) => {
            return parseFloat(a["distance"]) - parseFloat(b["distance"]);
        }).forEach((v, i) => {
            const name = v["name"] as string;
            const address = v["address"] as string;
            const location = locationToPos(v["location"] as string);
            if (location != undefined) {
                geographicCoordinateMarks.push(new GeographicCoordinateMark({
                    "city": city,
                    "country": country,
                    "district": district,
                    "location": location,
                    "name": name,
                    "province": province,
                    "street": street,
                    "township": township,
                    "address": address,
                }));
            }
        });
        const data = await GeographicCoordinateMark.insertMany(globalPlugin.dbConn, geographicCoordinateMarks);
        if (data.err == undefined) {
            return new HttpPackage({
                code: HttpPackageCode.OK, data: {
                    "address": geographicCoordinateMarks.map(e => e.toGeographicCMarkBase()),
                },
            });
        }
        return new HttpPackage({
            code: HttpPackageCode.GeneralError, data: {
                "address": []
            },
        });
    } else {
        return new HttpPackage({
            code: HttpPackageCode.GeneralError,
            data: {
                "address": []
            },
        });
    }
}, {
    properties: {
        location: {
            type: "string"
        }
    },
});




const setup: SetupService = async function setup(app) {
    const parserJsoner = parserJson();
    installRouter(app, [
        {
            path: "/position",
            middleware: [
                parserJsoner,
                loginProtect,
            ],
            child: [
                {
                    path: "/reversegeocoding",
                    on: {
                        "post": [reverseGeocoding.schemaType, reverseGeocoding.service]
                    }
                }
            ],
        },
    ]);
};

export { setup };

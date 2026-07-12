import { DocumentPickerResponse } from "react-native-document-picker";
import RenaultCharge from "../../../lib/clients/apiHandlers/renaultCharges/RenaultCharge";
import RNFS from 'react-native-fs';
import * as XLSX from 'xlsx';
import { parseRenaultCharges } from "./renaultChargesParser";
import { buildDateParser } from "./dateParser";

export const parseChargesFromExcel = async (result: DocumentPickerResponse): Promise<RenaultCharge[]> => {
    let fileContent;
    let workbook;
    let sheet;
    let data;
    try {
        fileContent = await RNFS.readFile(result.uri, 'base64');
        workbook = XLSX.read(fileContent, { type: 'base64' });
        if (workbook.SheetNames.length === 0) {
            throw new Error('No sheets found in the Excel file');
        }
        sheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(sheet);
    } catch (err) {
        throw new Error('errorReadingFile');
    }

    const parsedCharges: RenaultCharge[] = parseRenaultCharges(data);

    const dateStrings = parsedCharges.flatMap(c => [c.chargeStartDate!, c.chargeEndDate!]);
    const parse = buildDateParser(dateStrings);

    parsedCharges.forEach(charge => {
        const parsedStart = parse(charge.chargeStartDate ?? '');
        const parsedEnd = parse(charge.chargeEndDate ?? '');
        if (!parsedStart || !parsedEnd) {
            throw new Error('Invalid date format in the Excel file');
        }
        charge.chargeStartDate = parsedStart.toISOString();
        charge.chargeEndDate = parsedEnd.toISOString();
    });

    return parsedCharges;
}
import { expect } from "chai";
import Constants from "../../util/constants.js";
import AdmZip from "../../adm-zip.js";
import { join } from "path";
const __dirname = import.meta.dirname

describe("adm-zip", () => {
    it("adds multibyte ZIP comment in UTF-8 with appropriate byte", () => {
        const zip = new AdmZip();
        zip.addLocalFile(join(__dirname, "./じっぷ/じっぷ.txt"));
        zip.addZipComment("じっぷ");
        const willSend = zip.toBuffer();
        const end = willSend.slice(willSend.lastIndexOf(Constants.ENDSIG));
        const commentLength = end.readInt16LE(Constants.ENDCOM, 2);
        expect(commentLength).to.eq(9);
        const expected = Buffer.from("じっぷ");
        const actual = end.slice(Constants.ENDCOM + 2);
        expect(actual).to.include(expected);
        expect(expected).to.include(actual);
    });
});

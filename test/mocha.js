import  { expect } from "chai"
//const Attr = require("../util").FileAttr;
import Zip from "../adm-zip.js"
import pth from "path"
import fs from "fs"
import rimraf from "rimraf"

describe("adm-zip", () => {
    const destination = "./test/xxx";

    // clean up folder content
    afterEach((done) => rimraf(destination, done));

    it("zip pathTraversal", () => {
        const target = pth.join(destination, "test");
        const zip = new Zip();
        zip.addFile("../../../test1.ext", "content");
        zip.addFile("folder/../../test2.ext", "content");
        zip.addFile("test3.ext", "content");

        const extract = new Zip(zip.toBuffer());
        zip.getEntries().forEach((e) => zip.extractEntryTo(e, destination, false, true));

        extract.extractAllTo(target);
        const files = walk(target);
        expect(files.sort()).to.deep.equal([pth.normalize("./test/xxx/test/test1.ext"), pth.normalize("./test/xxx/test/test2.ext"), pth.normalize("./test/xxx/test/test3.ext")]);
    });

    it("zip.addFile - add directory", () => {
        const zip1 = new Zip();
        zip1.addFile("dir11/", null);
        zip1.addFile("dir12/", undefined);
        zip1.addFile("dir13/", "");
        zip1.addFile("dir11/dir21/");
        zip1.addFile("dir11/dir22/");
        zip1.addFile("dir12/dir23/");
        zip1.addFile("dir13/dir24/");
        zip1.addFile("dir11/dir22/test.txt", "content");
        const zip2 = new Zip(zip1.toBuffer());
        const zip2Entries = zip2.getEntries().map((e) => e.entryName);

        expect(zip2Entries).to.deep.equal(["dir11/", "dir11/dir21/", "dir11/dir22/", "dir11/dir22/test.txt", "dir12/", "dir12/dir23/", "dir13/", "dir13/dir24/"]);
    });

    it("passes issue-237-Twizzeld test case", () => {
        const zip = new Zip("./test/assets/issue-237-Twizzeld.zip");
        const zipEntries = zip.getEntries();
        zipEntries.forEach(function (zipEntry) {
            if (!zipEntry.isDirectory) {
                zip.extractEntryTo(zipEntry, "./", false, true);
                // This should create text.txt on the desktop.
                // It will actually create two, but the first is overwritten by the second.
            }
        });
        let text = fs.readFileSync("./text.txt").toString();
        expect(text).to.equal("ride em cowboy!");
        fs.unlinkSync("./text.txt");
    });

    it("passes issue-438-AddFile with windows path sepator", () => {
        const zip = new Zip();
        zip.addFile("foo\\bar.txt", "test", "test");
        zip.extractAllTo(destination);

        const files = walk(destination);

        expect(files.sort()).to.deep.equal([pth.normalize("./test/xxx/foo/bar.txt")].sort());
    });

    it("testing noSort option", () => {
        const content = "test";
        const comment = "comment";

        // is sorting working - value "false"
        const zip1 = new Zip({ noSort: false });
        zip1.addFile("a.txt", content, comment);
        zip1.addFile("c.txt", content, comment);
        zip1.addFile("b.txt", content, comment);
        zip1.addFile("a.txt", content, comment);
        zip1.toBuffer();

        const zip1Entries = zip1.getEntries().map((e) => e.entryName);
        expect(zip1Entries).to.deep.equal(["a.txt", "b.txt", "c.txt"]);

        // skip sorting - value "true"
        const zip2 = new Zip({ noSort: true });
        zip1.addFile("a.txt", content, comment);
        zip2.addFile("c.txt", content, comment);
        zip2.addFile("b.txt", content, comment);
        zip2.addFile("a.txt", content, comment);
        zip2.toBuffer();

        const zip2Entries = zip2.getEntries().map((e) => e.entryName);
        expect(zip2Entries).to.deep.equal(["c.txt", "b.txt", "a.txt"]);
    });

    it("windows style path with backslash should be converted to slashes", () => {
        const content = "test";
        const comment = "comment";

        // is sorting working - value "false"
        const zip1 = new Zip({ noSort: true });
        // next 3 lines are with identical names, so only one file is added
        zip1.addFile("..\\..\\..\\windows\\system32\\drivers\\etc\\hosts.txt", content, comment);
        zip1.addFile("aa\\bb\\..\\cc\\..\\..\\windows\\system32\\drivers\\admin\\..\\etc\\hosts.txt", content, comment);
        zip1.addFile(".\\windows\\system32\\drivers\\etc\\hosts.txt", content, comment);
        // 3 other file
        zip1.addFile("system32\\drivers\\etc\\hosts.txt", content, comment);
        zip1.addFile("drivers\\etc\\hosts.txt", content, comment);
        zip1.addFile(".\\hosts.txt", content, comment);
        zip1.toBuffer();

        const zip1Entries = zip1.getEntries().map((e) => e.entryName);
        expect(zip1Entries).to.deep.equal(["windows/system32/drivers/etc/hosts.txt", "system32/drivers/etc/hosts.txt", "drivers/etc/hosts.txt", "hosts.txt"]);
    });

    // Issue 64
    it("zip.writeZip - multiple times", () => {
        const zip = new Zip("./test/assets/ultra.zip");
        const fileName = pth.resolve(destination, "writezip");

        for (let i = 0; i < 5; i++) zip.writeZip(`${fileName}.${i}.zip`);

        const expected_list = ["./test/xxx/writezip.0.zip", "./test/xxx/writezip.1.zip", "./test/xxx/writezip.2.zip", "./test/xxx/writezip.3.zip", "./test/xxx/writezip.4.zip"].map(
            pth.normalize
        );

        const files = walk(destination);
        expect(files.sort()).to.deep.equal(expected_list);
    });

    /*
    it("repro: symlink", () => {
        const zip = new Zip("./test/assets/symlink.zip");
        zip.extractAllTo(destination);

        const linkPath = pth.join(destination, "link");
        const linkStat = fs.lstatSync(linkPath);
        expect(linkStat.isSymbolicLink()).to.be.true;

        const linkTarget = fs.readlinkSync(linkPath);
        expect(linkTarget).to.equal("target");

        const linkContent = fs.readFileSync(linkPath);
        expect(linkContent).to.equal("diddlydiddly doo, i'm a linkaroo");
    });
    */
});

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = dir + "/" + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else {
            /* Is a file */
            results.push(pth.normalize(file));
        }
    });
    return results;
}

import { InfoSourceType, NintendoGameData } from "../../info-source/info-source-model";
import { InfoResolver } from "../resolve-service";
import { withBrowser } from "../../util/with-browser";

export class NintendoResolver implements InfoResolver {
    public type = InfoSourceType.Nintendo;

    public async resolve(id: string): Promise<NintendoGameData> {
        console.time("Resolve Nintendo");

        return await withBrowser(async (page) => {
            await page.goto(id);
            console.timeEnd("Resolve Nintendo");

            await page.waitForSelector(".release-date > dd");

            const fullName = await page.$eval(".game-title", (el) => el.textContent!.trim());
            const thumbnailUrl = await page.evaluate(() => document.querySelector(".hero-illustration > img")!.getAttribute("src")!)

            const price = await page.evaluate(() => document.querySelector('.price > .msrp')?.textContent?.trim());
            const salePrice = await page.evaluate(() => document.querySelector('.price > .sale-price')?.textContent?.trim());

            const releaseDate = await page.$eval(".release-date > dd", (el) => el.textContent?.trim());

            return {
                id,
                storeUrl: id,
                fullName,
                thumbnailUrl,
                priceInformation: price ? {
                    initial: price,
                    final: salePrice || price
                } : undefined,
                releaseDate,
            };
        })
    }
}
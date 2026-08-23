import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "D:/WorkSpace/FullStack/music/outputs/bakery_leads";
await fs.mkdir(outputDir, { recursive: true });

const researchedDate = "2026-08-09";

const leads = [
  ["Kabir's Bakery", "Wholesale bakery", "(718) 852-1768", "order@kabirsbakery.com", "19 5th Street", "Brooklyn", "NY", "11231", "https://kabirsbakery.nyc/", "Wholesale baking, delivery across five boroughs", "Working website", "Medium", "New"],
  ["Bourke Street Bakery NYC - NoMad", "Bakery cafe", "718-744-4803", "", "15 East 28th Street", "New York", "NY", "10016", "https://www.bourkestreetbakery.com/contact", "Artisanal bakery-cafe; pastries, sourdough, coffee", "Working website", "Low", "New"],
  ["Bourke Street Bakery NYC - Grand Central", "Bakery cafe", "917-597-8332", "", "89 E 42nd Street, Suite MC-30", "New York", "NY", "10017", "https://www.bourkestreetbakery.com/contact", "High-traffic location; order and location-page opportunity", "Working website", "Low", "New"],
  ["Grandaisy Bakery", "Artisan bakery", "212-334-9435", "info@grandaisybakery.com", "250 West Broadway", "New York", "NY", "10013", "https://www.grandaisybakery.com/", "Artisan bread, pizza, pastries; has wholesale inquiries", "Working website", "Medium", "New"],
  ["Pancito Bakery", "Wholesale artisan bakery", "929-732-1012", "sales@pancito.com", "", "New York", "NY", "", "https://pancito.com/contact-artisanal-bakery-ny/", "Wholesale in local New York area", "Working website", "Medium", "New"],
  ["Balthazar Bakery", "Bakery retail/catering", "(212) 965-1785", "contact@balthazarbakery.com", "80 Spring Street", "New York", "NY", "10012", "https://balthazarny.com/bakery/", "Catering, cakes, tarts, breads, delivery", "Working website", "Low", "New"],
  ["Big Booty Bread Co.", "Bakery", "212.414.3056", "Bigbootybreadco@gmail.com", "261 W 23rd Street", "New York", "NY", "10011", "https://www.bigbootybreadco.com/", "Latin-inspired baked goods; retail bakery", "Working website", "Medium", "New"],
  ["Somedays Bakery - Bay Terrace", "Bakery cafe", "917-577-6287", "", "The Bay Terrace", "Queens", "NY", "", "https://bayterrace.com/business/somedays-bakery/", "Pastries, catering/private events/franchising noted", "Directory only / no clear site", "High", "New"],
  ["Eli's Bread", "Wholesale bakery", "(212) 831-4800", "rohit@elizabar.com", "403 East 91st Street", "New York", "NY", "10128", "https://www.elisbreadnyc.com/contactus", "Wholesale account contact and sales department listed", "Working website", "Medium", "New"],
  ["D'Lioz Bakery", "Artisanal cafe bakery", "+1 646-422-7201", "Dliozbakery@gmail.com", "969 Amsterdam Avenue", "New York", "NY", "10025", "https://dliozbakery.com/en/contact", "Phone and WhatsApp listed; reservations/groups", "Working website", "Medium", "New"],
  ["Serano Bakery Astoria", "Bakery", "(929) 556-4459", "", "35-14 30th Ave.", "Astoria", "NY", "11103", "https://seranobakeryastoria.com/", "Catering, bulk orders, dessert tables, custom cakes", "Working website", "Medium", "New"],
  ["Sancho Pancho Bakery", "Wholesale bakery", "1-347-497-5176", "NyBakery@gmail.com", "6905 Fort Hamilton Pkwy", "Brooklyn", "NY", "11228", "https://www.sanchopanchobakery.com/", "Wholesale cakes and desserts", "Working website", "Medium", "New"],
  ["Strauss Bakery Retail", "Bakery retail", "(718) 851-7728", "Orders@straussbakery.com", "5115 13th Avenue", "Brooklyn", "NY", "11219", "https://straussbakery.com/contact-us/", "Retail bakery location", "Working website", "Low", "New"],
  ["Strauss Bakery Wholesale", "Wholesale bakery", "(718) 851-8751", "Orders@straussbakery.com", "1430 37th Street", "Brooklyn", "NY", "11218", "https://straussbakery.com/contact-us/", "Separate wholesale location", "Working website", "Medium", "New"],
  ["NY Brooklyn Bread", "Wholesale bakery supply", "718-837-0709", "", "8118 18th Ave", "Brooklyn", "NY", "11214", "https://nybrooklynbread.com/", "Wholesale bread, rolls, bagels for foodservice buyers", "Working website", "Medium", "New"],
  ["Bushwick Bakery", "Bakery wholesale/catering", "(718) 541-5739", "bushwickbakery.ss@gmail.com", "127 Central Ave.", "Brooklyn", "NY", "11237", "https://www.bushwick-bakery.com/contact", "Wholesale and special orders contact", "Working website", "Medium", "New"],
  ["The Good Batch Bakery", "Bakery/catering/wholesale", "(718) 622-4000", "", "936 Fulton Street", "Brooklyn", "NY", "11238", "https://thegoodbatch.com/", "Catering and wholesale sections", "Working website", "Medium", "New"],
  ["Bread Plus Outlet", "Wholesale bakery manufacturer", "1 (347) 462-3838", "breadplusoutlet@gmail.com", "16 Avenue T", "Brooklyn", "NY", "11223", "https://breadplusoutlet.com/", "Wholesale credit application and nationwide delivery", "Working website", "Medium", "New"],
  ["ByClio Bakery", "Custom cakes/wholesale", "(585) 204-3121", "", "400 3rd Avenue", "Brooklyn", "NY", "11215", "https://www.bycliobakery.net/", "Custom cakes and wholesale cookie dough", "Working website", "Medium", "New"],
  ["Bread Plus Bakery", "Wholesale and retail bakery", "(718) 373-3700", "", "2841 Harway Ave", "Brooklyn", "NY", "11214", "https://www.breadplusbaker.com/", "Retail plus wholesale bakery family", "Working website", "Medium", "New"],
  ["Sunrise Bakery", "Wholesale bread distributor", "(646) 235-7414", "", "65 Bay 19th Street", "Brooklyn", "NY", "11214", "https://sunrisebakeryny.com/", "Strictly wholesale bread delivery", "Working website", "Medium", "New"],
  ["Il Fornaretto Bakery - 17th Ave.", "Wholesale and retail bakery", "(718) 236-6669", "office17@ilfornarettobakery.com", "7616 17th Ave", "Brooklyn", "NY", "11214", "https://www.ilfornarettobakery1927.com/", "Wholesale and retail bakery serving Tri-State area", "Working website", "Medium", "New"],
  ["Il Fornaretto Bakery - 5th Ave.", "Wholesale and retail bakery", "(718) 680-2323", "office@ilfornarettobakery.com", "7612 5th Ave", "Brooklyn", "NY", "11209", "https://www.ilfornarettobakery1927.com/", "Second retail/wholesale location", "Working website", "Medium", "New"],
  ["All You Knead Bakery", "Artisan bakery", "", "allyouknead67@gmail.com", "308 Main Street", "Beacon", "NY", "12508", "https://www.allyoukneadny.com/", "Special orders, wholesale, catering requests", "Working website", "Medium", "New"],
  ["Royal Crown Bakery", "Wholesale bakery", "(718) 234-3208", "", "6308 14th Ave", "Brooklyn", "NY", "11219", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Listed as wholesale bakery", "Directory only / no clear site", "High", "New"],
  ["Aladdin Bakers", "Wholesale bakery", "(718) 499-1818", "", "240 25th St", "Brooklyn", "NY", "11232", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Listed as wholesale bakery; bread products", "Directory only / no clear site", "High", "New"],
  ["New Style Bakery Inc", "Wholesale bakery", "(718) 437-4222", "", "896 Mcdonald Ave", "Brooklyn", "NY", "11218", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Listed as wholesale bakery", "Directory only / no clear site", "High", "New"],
  ["Russian Bread Co Inc", "Wholesale bakery", "(718) 372-8530", "", "129 Brighton Beach Ave", "Brooklyn", "NY", "11235", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Listed as wholesale bakery", "Directory only / no clear site", "High", "New"],
  ["T & D Bakery", "Wholesale bakery", "(718) 769-2267", "", "2307 Avenue U", "Brooklyn", "NY", "11229", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Listed as wholesale bakery and wedding cakes/pastries", "Directory only / no clear site", "High", "New"],
  ["Brauner's Bakery", "Wholesale bakery", "(718) 851-1077", "", "1327 54th St", "Brooklyn", "NY", "11219", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Listed as wholesale bakery", "Directory only / no clear site", "High", "New"],
  ["The BAKERY on Bergen", "Bakery/cupcakes/gluten-free", "(917) 519-6549", "", "740 Bergen St", "Brooklyn", "NY", "11238", "https://www.restaurantji.com/ny/brooklyn/the-bakery-on-bergen-/", "Directory listing shows website/order links but no clear owned website in result", "Website needs review", "High", "New"],
  ["Brooklyn Bread Company", "Bakery", "(718) 998-0141", "", "292 Kings Hwy", "Brooklyn", "NY", "11223", "https://www.restaurantji.com/ny/brooklyn/brooklyn-bread-company-/", "Directory listing, local bakery with delivery mention", "Website needs review", "High", "New"],
  ["Cakalicious Cakes", "Wholesale bakery/desserts", "(877) 504-2253", "", "1108 E 55th St", "Brooklyn", "NY", "11234", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Directory listing only; cakes/desserts niche", "Directory only / no clear site", "High", "New"],
  ["Front Row Sweets", "Wholesale bakery/restaurant", "(718) 258-7550", "", "4901 Glenwood Rd", "Brooklyn", "NY", "11234", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Directory listing only; sweets brand could need product gallery", "Directory only / no clear site", "High", "New"],
  ["Marbre", "Wholesale bakery", "(347) 296-9368", "", "999 Atlantic Ave", "Brooklyn", "NY", "11238", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Directory listing only; wholesale bakery", "Directory only / no clear site", "High", "New"],
  ["European Custom Desserts", "Bakery/wedding cakes", "(917) 937-6775", "", "830 39th St", "Brooklyn", "NY", "11232", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Directory listing only; wedding/custom dessert positioning", "Directory only / no clear site", "High", "New"],
  ["Everybody Eats", "Bakery/restaurant", "(718) 369-7444", "", "294 3rd Ave", "Brooklyn", "NY", "11215", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Directory listing only; bakery/restaurant could benefit from online ordering", "Directory only / no clear site", "High", "New"],
  ["Doughlicious Inc", "Wholesale bakery", "(718) 621-4900", "", "1559 62nd St", "Brooklyn", "NY", "11219", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Directory listing only; wholesale bakery", "Directory only / no clear site", "High", "New"],
  ["Cammareri Bread Inc.", "Wholesale bakery", "(718) 676-4877", "", "4110 3rd Ave", "Brooklyn", "NY", "11232", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Directory listing only; bread business", "Directory only / no clear site", "High", "New"],
  ["Crystal Bakery", "Wholesale bakery", "(718) 483-8475", "", "2137 Knapp St", "Brooklyn", "NY", "11229", "https://www.yellowpages.com/brooklyn-ny/wholesale-bakeries", "Directory listing only; bakery", "Directory only / no clear site", "High", "New"]
];

function pitchForLead(row) {
  const [name, type, phone, email, address, city, state, zip, source, angle, websiteStatus] = row;
  if (websiteStatus === "Directory only / no clear site") {
    return `Pitch ${name} on replacing directory dependence with a simple bakery website: menu/product photos, call button, Google Maps, quote/order form, and SEO for ${city || "local"} bakery searches. They likely want more calls, trust, and wholesale/custom-order inquiries.`;
  }
  if (websiteStatus === "Website needs review") {
    return `Pitch a quick website audit first, then offer a cleaner site or repair: faster mobile pages, working order/contact buttons, updated photos, and stronger local SEO. They likely want fewer missed calls and easier online orders.`;
  }
  if (type.toLowerCase().includes("wholesale")) {
    return `Pitch wholesale lead capture: product catalog, account-request form, route/service area page, and email/phone CTAs. They likely want reliable restaurant/cafe buyers and easier repeat orders.`;
  }
  if (angle.toLowerCase().includes("catering") || angle.toLowerCase().includes("custom") || angle.toLowerCase().includes("cake")) {
    return `Pitch online ordering for events: cake/catering inquiry form, photo gallery, deposit/payment workflow, and occasion pages. They likely want higher-value custom orders with less back-and-forth.`;
  }
  return `Pitch a focused refresh: mobile menu, photos, reviews, online ordering/contact CTA, and neighborhood SEO. They likely want more walk-ins, calls, and repeat customers.`;
}

const workbook = Workbook.create();
const leadsSheet = workbook.worksheets.add("Bakery Leads");
const summarySheet = workbook.worksheets.add("Summary");
leadsSheet.showGridLines = false;
summarySheet.showGridLines = false;

const headers = [
  "Business Name", "Business Type", "Phone", "Email", "Address", "City", "State", "ZIP",
  "Website / Source", "Sales Angle", "Website Status", "Priority", "Outreach Status", "How To Pitch / What They Want", "Notes"
];
const lastRow = leads.length + 1;
leadsSheet.getRange("A1:O1").values = [headers];
leadsSheet.getRangeByIndexes(1, 0, leads.length, headers.length).values = leads.map((row) => [...row, pitchForLead(row), null].map((cell) => cell === "" ? null : cell));

const used = leadsSheet.getRange(`A1:O${lastRow}`);
used.format.font = { name: "Aptos", size: 10, color: "#111827" };
leadsSheet.getRange("A1:O1").format = {
  fill: "#234E52",
  font: { bold: true, color: "#FFFFFF", size: 10 },
  wrapText: true,
  verticalAlignment: "center",
};
leadsSheet.getRange(`A2:O${lastRow}`).format = {
  wrapText: true,
  verticalAlignment: "top",
  borders: { preset: "insideHorizontal", style: "thin", color: "#E5E7EB" },
};
leadsSheet.getRange(`A1:O${lastRow}`).format.borders = { preset: "outside", style: "thin", color: "#CBD5E1" };
leadsSheet.getRange("A:A").format.columnWidth = 28;
leadsSheet.getRange("B:B").format.columnWidth = 24;
leadsSheet.getRange("C:D").format.columnWidth = 20;
leadsSheet.getRange("E:E").format.columnWidth = 28;
leadsSheet.getRange("F:H").format.columnWidth = 13;
leadsSheet.getRange("I:I").format.columnWidth = 44;
leadsSheet.getRange("J:J").format.columnWidth = 42;
leadsSheet.getRange("K:M").format.columnWidth = 16;
leadsSheet.getRange("N:N").format.columnWidth = 58;
leadsSheet.getRange("O:O").format.columnWidth = 34;
leadsSheet.getRange("A1:O1").format.rowHeight = 32;
leadsSheet.getRange(`A2:O${lastRow}`).format.rowHeight = 64;
leadsSheet.freezePanes.freezeRows(1);
const table = leadsSheet.tables.add(`A1:O${lastRow}`, true, "BakeryLeadsTable");
table.style = "TableStyleMedium2";
table.showFilterButton = true;
leadsSheet.getRange(`L2:L${lastRow}`).dataValidation = { rule: { type: "list", values: ["High", "Medium", "Low"] } };
leadsSheet.getRange(`M2:M${lastRow}`).dataValidation = { rule: { type: "list", values: ["New", "Called", "Emailed", "Follow-up", "Won", "Not Fit"] } };

summarySheet.getRange("A1:F1").merge();
summarySheet.getRange("A1").values = [["Bakery Website Sales Leads"]];
summarySheet.getRange("A2:F2").merge();
summarySheet.getRange("A2").values = [[`Researched ${researchedDate}. Focus: NYC/Brooklyn bakeries with public phone numbers, no-clear-website targets, website-review targets, and store/ordering opportunities.`]];
summarySheet.getRange("A1:F2").format = {
  fill: "#F8FAFC",
  font: { name: "Aptos", color: "#0F172A" },
  wrapText: true,
};
summarySheet.getRange("A1").format.font = { bold: true, size: 18, color: "#234E52" };
summarySheet.getRange("A2").format.font = { italic: true, size: 10, color: "#475569" };
summarySheet.getRange("A4:B10").values = [
  ["Metric", "Value"],
  ["Total leads", ""],
  ["High priority leads", ""],
  ["Leads with emails", ""],
  ["No clear website / directory only", ""],
  ["Website needs review", ""],
  ["Working website", ""],
];
summarySheet.getRange("B5:B10").formulas = [
  [`=COUNTA('Bakery Leads'!A2:A${lastRow})`],
  [`=COUNTIF('Bakery Leads'!L2:L${lastRow},"High")`],
  [`=COUNTA('Bakery Leads'!D2:D${lastRow})`],
  [`=COUNTIF('Bakery Leads'!K2:K${lastRow},"Directory only / no clear site")`],
  [`=COUNTIF('Bakery Leads'!K2:K${lastRow},"Website needs review")`],
  [`=COUNTIF('Bakery Leads'!K2:K${lastRow},"Working website")`],
];
summarySheet.getRange("A4:B4").format = { fill: "#234E52", font: { bold: true, color: "#FFFFFF" } };
summarySheet.getRange("A5:A10").format.font = { bold: true };
summarySheet.getRange("B5:B10").format.numberFormat = "#,##0";
summarySheet.getRange("A4:B10").format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
summarySheet.getRange("D4:F4").values = [["Priority Guide", "Meaning", "Suggested action"]];
summarySheet.getRange("D5:F8").values = [
  ["High", "Directory only, no clear site, or website needs review", "Pitch modern website, working contact/order flow, and local SEO"],
  ["Medium", "Existing site, but clear growth/wholesale/catering angle", "Pitch redesign, ordering, SEO, lead capture"],
  ["Low", "Established brand or strong site", "Approach only with specific improvement idea"],
  ["Website review", "Has some web presence but may rely on a listing or weak ordering path", "Lead with a quick audit: mobile, forms, ordering, photos, speed"],
];
summarySheet.getRange("D4:F4").format = { fill: "#234E52", font: { bold: true, color: "#FFFFFF" } };
summarySheet.getRange("D5:F8").format = { wrapText: true, verticalAlignment: "top" };
summarySheet.getRange("D4:F8").format.borders = { preset: "all", style: "thin", color: "#CBD5E1" };
summarySheet.getRange("A:A").format.columnWidth = 24;
summarySheet.getRange("B:B").format.columnWidth = 16;
summarySheet.getRange("C:C").format.columnWidth = 4;
summarySheet.getRange("D:D").format.columnWidth = 18;
summarySheet.getRange("E:E").format.columnWidth = 34;
summarySheet.getRange("F:F").format.columnWidth = 38;
summarySheet.getRange("A1:F2").format.rowHeight = 28;
summarySheet.getRange("D5:F8").format.rowHeight = 48;

const leadCheck = await workbook.inspect({
  kind: "table",
  sheetId: "Bakery Leads",
  range: "A1:O8",
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: 15,
});
console.log(leadCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 50 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const preview1 = await workbook.render({ sheetName: "Summary", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(`${outputDir}/summary_preview.png`, new Uint8Array(await preview1.arrayBuffer()));
const preview2 = await workbook.render({ sheetName: "Bakery Leads", range: "A1:O12", scale: 1, format: "png" });
await fs.writeFile(`${outputDir}/leads_preview.png`, new Uint8Array(await preview2.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/bakery_website_sales_leads.xlsx`);
console.log(`${outputDir}/bakery_website_sales_leads.xlsx`);

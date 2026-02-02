import { Document, Packer, Paragraph } from "docx";
import fs from "fs";
import path from "path";

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph("संपत्ति-विशेष निवेश अनुबंध"),
        new Paragraph("Property-Specific Investment Annexure"),
      ],
    },
  ],
});

(async () => {
  const buffer = await Packer.toBuffer(doc);

  const filePath = path.join(
    process.cwd(),
    "templates",
    "investment_template.docx"
  );

  fs.writeFileSync(filePath, buffer);

  console.log("✅ investment_template.docx created successfully");
})();

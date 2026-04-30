const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, unique + safeExt);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB

  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    // ✔ validar extensión
    if (ext !== ".csv") {
      return cb(new Error("Solo archivos CSV"));
    }

    // ✔ validar MIME (extra seguridad)
    if (
      mime !== "text/csv" &&
      mime !== "application/vnd.ms-excel"
    ) {
      return cb(new Error("Tipo de archivo inválido"));
    }

    cb(null, true);
  }
});

module.exports = upload;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Crear carpeta uploads si no existe
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
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      return cb(new Error("Solo se permiten archivos CSV."));
    }
    cb(null, true);
  },
});

module.exports = upload;

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
    const allowedMime = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedExt.includes(ext)) {
      return cb(new Error("Formato de imagen no permitido"));
    }

    if (!allowedMime.includes(mime)) {
      return cb(new Error("Tipo MIME inválido"));
    }

    cb(null, true);
  }
});

module.exports = upload;
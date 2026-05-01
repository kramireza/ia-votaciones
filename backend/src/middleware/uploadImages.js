// backend/src/middleware/uploadImages.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const FileType = require("file-type");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ======================================
// 🔐 STORAGE SEGURO
// ======================================
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

// ======================================
// 🔐 FILTRO INICIAL (BÁSICO)
// ======================================
const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },

  fileFilter: (req, file, cb) => {
    const allowedMime = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedMime.includes(file.mimetype)) {
      return cb(new Error("Tipo de archivo no permitido"));
    }

    cb(null, true);
  }
});

// ======================================
// 🔥 VALIDACIÓN REAL DEL ARCHIVO
// ======================================
const validateImage = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const filePath = req.file.path;

    const fileBuffer = fs.readFileSync(filePath);

    const type = await FileType.fromBuffer(fileBuffer);

    if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type.mime)) {
      fs.unlinkSync(filePath); // eliminar archivo malicioso

      return res.status(400).json({
        message: "Archivo inválido o corrupto"
      });
    }

    next();

  } catch (err) {
    console.error("Error validando imagen:", err);
    return res.status(500).json({
      message: "Error validando archivo"
    });
  }
};

module.exports = { upload, validateImage };
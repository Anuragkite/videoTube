import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // file are stored in this loc. "./public/temp"
  },
  filename: function (req, file, cb) {
    // todo for the user to change the file name
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });

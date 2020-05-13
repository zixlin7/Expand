const express = require("express");
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');

const AWS = require("aws-sdk");
const AWS_Uploaded_File_URL_LINK = require('../../config/keys').AWS_Uploaded_File_URL_LINK;
const AWS_REGION = require('../../config/keys').AWS_REGION;
const AWS_SECRET_ACCESS_KEY = require('../../config/keys').AWS_SECRET_ACCESS_KEY;
const AWS_ACCESS_KEY_ID = require('../../config/keys').AWS_ACCESS_KEY_ID;
const AWS_BUCKET_NAME = require('../../config/keys').AWS_BUCKET_NAME;

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const Lesson = require('../../models/Lesson');
//validations go here

//all lessons
router.get("/", (req, res) => {
    Lesson.find()
        .sort({ date: -1 })
        .then(lessons => res.json(lessons))
        .catch(err => res.status(404).json({ nolessonsfound: 'No lessons found' }));
});

//single lesson
router.get("/:id", (req, res) => {
    Lesson.findById(req.params.id)
        .then(lesson => res.json(lesson))
        .catch(err => res.status(404).json({ nolessonfound: 'No lesson found' }));
})

//create lesson
// router.post('/',
//     // passport.authenticate('jwt', { session: false }),
//     (req, res) => {

//         const newLesson = new Lesson({
//             title: req.body.title,
//             description: req.body.description,
//             fileLink: req.body.fileLink,
//         });

//         newLesson.save().then(lesson => res.json(lesson));
//     }
// );

// router.post("/", upload.single("file"), (req, res) => {
router.post("/", (req, res) => {
    console.log(req.body);
    debugger
    const file = req.body.file;
    const s3FileURL = AWS_Uploaded_File_URL_LINK;
    console.log("in post...")
    let s3bucket = new AWS.S3({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION
    });
    if (!file) return res.status(418).json("Dammit");
    let params = {
        Bucket: AWS_BUCKET_NAME,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read"
    };

    s3bucket.upload(params, function (err, data) {
        if (err) {
            console.log("failed")
            res.status(500).json({ error: true, Message: err });
        } else {
            const newLesson = new Lesson({
                title: req.body.title,
                description: req.body.description,
                fileLink: s3FileURL + file.originalname
            });
            console.log("attempting save")
            newLesson.save().then(lesson => res.json(lesson));
        }
    });
});

//update lesson
router.patch('/:id',
    (req, res) => {

        Lesson.findOneAndUpdate({ _id: req.params.id }, req.body,
            { new: true }, function (err, lesson) {
                res.json(lesson);
            });
    }
);

//delete lesson
router.delete('/:id',
    // passport.authenticate('jwt', { session: false }),
    (req, res) => {

        Lesson.findOneAndDelete({ _id: req.params.id },
            function (err, lesson) {
                res.json(lesson);
            });
    }
);

// router.route("/:id").delete((req, res, next) => {
//     DOCUMENT.findByIdAndRemove(req.params.id, (err, result) => {
//         if (err) {
//             return next(err);
//         }
//         //Now Delete the file from AWS-S3
//         // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
//         let s3bucket = new AWS.S3({
//             accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//             secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//             region: process.env.AWS_REGION
//         });

//         let params = {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: result.s3_key
//         };

//         s3bucket.deleteObject(params, (err, data) => {
//             if (err) {
//                 console.log(err);
//             } else {
//                 res.send({
//                     status: "200",
//                     responseType: "string",
//                     response: "success"
//                 });
//             }
//         });
//     });
// });

module.exports = router; 
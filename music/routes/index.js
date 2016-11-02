var express = require('express');
var router = express.Router();
var mediaPath = 'public/media';
/* GET home page. */
router.get('/', function(req, res, next) {
  var fs = require('fs');
  fs.readdir(mediaPath,function (err, files) {
    if(err){
      console.log(err);
    }else{
      res.render('index', { title: 'Passionate music',music:files});
    };
  })
});

module.exports = router;

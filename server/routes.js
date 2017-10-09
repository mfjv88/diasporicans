const express = require('express'),
      path = require('path'),
      bodyParser = require('body-parser'),
      nodemailer = require('nodemailer'),
      app = express(),
      env = require('dotenv').config(),
      router = require('express').Router();
      Host = require('./db/host'),
      Donate = require('./db/donate');

const Lob = require('lob')(process.env.LOB_LIVE_KEY);

// Configuration for nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS
  }
});

// Body Message for Confirmation Email
const message = function(section){
  let body = "Thank you for contacting <a href='http://www.diasporicans.com'>diasporicans.com</a><br><br>We will be contacting as soon as possible regarding to your submission in the " + section + " section. <br><br> Remember to 'Like' and 'Share' our page, <a href='https://www.facebook.com/diasporicans/'>Diasporicans</a> on Facebook, to create more awareness in the diaspora and in your network about what's going on in Puerto Rico.<br><br> Cheers y ¡pa' lante, Boricua!"
  return body;
}

// Main page view
router.get('/', function (req, res) {
    res.render('home');
});

router.get('/maps', function (req, res) {
    res.render('maps');
});

router.get('/donations', function (req, res) {
    res.render('donations');
});

router.get('/contact', function (req, res) {
    res.render('contact');
});

router.get('/toolsForPR', function (req, res) {
    res.render('toolsForPR');
});

router.get('/pr', function (req, res) {
    res.render('puertorico', {layout:false});
});

router.get('/pr/maps', function (req, res) {
    res.render('puertorico-maps', {layout:false});
});

// router.get('/pr/data', function (req, res) {
//     res.render('puertorico', {layout:false});
// });


// Form for Hosting a Donation Center
router.post('/form/host-center', function(req, res){

  let accepted = false;
  if(req.body.accept === 'on'){
    accepted = true;
  }

  if(req.body.residence === 'true'){
    req.flash('error', 'Address cannot be a residence.');
    res.redirect('/donations');
  } else {
    // Getting details about form
    const result = {
      'first_name': req.body.FirstNameHost,
      'last_name': req.body.LastNameHost,
      'email': req.body.EmailAddressHost,
      'telephone': req.body.TelephoneHost,
      'date_from': req.body.FromTimeHost,
      'date_to': req.body.ToTimeHost,
      'location': req.body.StreetAddressHost + ', ' + req.body.CityHost + ' ' + req.body.StateHost + ' ' + req.body.ZipHost,
      'created_date': new Date(),
      'accepted': accepted
    };

    // Verifying with Lob
    Lob.usVerifications.verify({
      primary_line: req.body.StreetAddressHost,
      city: req.body.CityHost,
      state: req.body.StateHost,
      zip_code: req.body.ZipHost
    }, function (error, response) {
      if (response.components.address_type === 'residential') {
        req.flash('error', 'Address cannot be a residence.');
        res.redirect('/donations');
      }
      else if (response.deliverability === 'no_match' || response.deliverability === 'undeliverable') {
        req.flash('error', 'Please verify the address is correct.');
        res.redirect('/donations');
      }
    });


    // Setting options for delivery for Diasporicans
    const mailOptions_to_diasporicans = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: 'Host Center',
      text: JSON.stringify(result,null,2)
    };


    // // Setting options for delivery for sender
    const mailOptions_to_sender = {
      from: process.env.EMAIL,
      to: result.email,
      subject: 'Thank you for contacting us',
      html: message('Hosting a Donation Center')
    };

    // Deliver message to Diasporicans
    transporter.sendMail(mailOptions_to_diasporicans, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    // Deliver message to sender
    transporter.sendMail(mailOptions_to_sender, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    // Store in DB
    Host.create(result,function(err, data){
    if (err) {
      req.flash('error', 'Something went wrong.');
      res.redirect('/donations');
     } else {
       req.flash('success', 'Your submission has been completed.');
       res.redirect('/donations');
     }
    })
  }
});


// Form to Donate Time
router.post('/form/donate-time', function(req, res){
  let accepted = false;
  if(req.body.accept === 'on'){
    accepted = true;
  }

  // Getting details about form
  const result = {
    'first_name': req.body.FirstNameDonate,
    'last_name': req.body.LastNameDonate,
    'email': req.body.EmailAddressDonate,
    'telephone': req.body.TelephoneDonate,
    'profession': req.body.ProfessionalDonate,
    'howtohelp': req.body.HowToHelp,
    'created_date': new Date(),
    'accepted': accepted
  }

  // Setting options for delivery for Diasporicans
  const mailOptions_to_diasporicans = {
    from: process.env.EMAIL,
    to: process.env.EMAIL,
    subject: 'Donate Time',
    text: JSON.stringify(result,null,2)
  };

  // Setting options for delivery for sender
  const mailOptions_to_sender = {
    from: process.env.EMAIL,
    to: result.email,
    subject: 'Thank you for contacting us',
    html: message('Donate Time')
  };


  // Deliver message to Diasporicans
  transporter.sendMail(mailOptions_to_diasporicans, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  // Deliver message to sender
  transporter.sendMail(mailOptions_to_sender, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  // Store in DB
  Donate.create(result,function(err, data){
  if (err) {
      res.json({ message: 'Something went wrong'});
      res.send(err);
   } else {
     res.status(202).redirect('/');
   }
  })
})


// Form for Contact Us
router.post('/form/contactus', function(req, res){
  // Getting details about form
  const result = {
    'first_name': req.body.FirstNameContact,
    'last_name': req.body.LastNameContact,
    'email': req.body.EmailAddressContact,
    'telephone': req.body.TelephoneContact,
    'profession': req.body.ProfessionalContact,
    'created_date': new Date(),
    'message': req.body.MessageContact
  }

  // Setting options for delivery for Diasporicans
  const mailOptions_to_diasporicans = {
    from: process.env.EMAIL,
    to: process.env.EMAIL,
    subject: 'Message for Diasporicans',
    text: JSON.stringify(result,null,2)
  };

  // Setting options for delivery for sender
  const mailOptions_to_sender = {
    from: process.env.EMAIL,
    to: result.email,
    subject: 'Thank you for contacting us',
    html: message('Contact Us')
  };

  // Deliver message to Diasporicans
  transporter.sendMail(mailOptions_to_diasporicans, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  // Deliver message to sender
  transporter.sendMail(mailOptions_to_sender, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  // Redirect to main page
  res.status(202).redirect('/');
});

module.exports = router;

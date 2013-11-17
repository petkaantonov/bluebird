// the base for dist files
var baseDistFile = 'dist/rsvp-<%= pkg.version %>.';
var builds = ['amd.', '' /* normal rsvp.js */ ];
var s3Uploads = [];
builds.forEach(function(build){
  var srcFile = baseDistFile + build + 'js';
  s3Uploads.push({ src: srcFile, dest: 'rsvp-<%= env.TRAVIS_COMMIT %>.' + build + 'js' });
  s3Uploads.push({ src: srcFile, dest: 'rsvp-latest.' + build + 'js' });
});

module.exports = {
  options: {
    bucket: 'rsvpjs-builds',
    access: 'public-read'
  },
  dev: {
    upload: s3Uploads
  }
};

// json preview module
ckan.module('cesiumpreview', function (jQuery, _) {
  return {
    initialize: function () {
      var self = this;
	  
//      var vis_server = 'http://localhost';  //local
      var vis_server='http://nationalmap.research.nicta.com.au/';
      
      //figure out data format
      var data_fmt = '';
      var fmt = preload_resource['format'];
      if (fmt !== undefined && fmt !== '') {
         data_fmt = '&format=' + fmt;
      }
      
      var data_url = encodeURIComponent(preload_resource['url']);
      var style = 'height: 600px; width: 100%; border: none;';
      var display = 'allowFullScreen mozAllowFullScreen webkitAllowFullScreen';

      var html = '<iframe src="' + vis_server + '?data_url=' + data_url + data_fmt + '" style="' + style + '" ' + display + '></iframe>';
      
      console.log(html);
      
      self.el.html(html);
    }
  };
});

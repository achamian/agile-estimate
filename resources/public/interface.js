$(function() {
  var value = 100;
  $(".velocity.slider").slider({
    min: 0,
    max: 100,
    value: value,
    animate: true,
    orientation: "vertical",
     slide: function( event, ui ) {
      // update the text value here
    }
  });

  $(".stories.slider").slider({
    min: 0,
    max: 100,
    value: value,
    animate: true,
    orientation: "vertical",
     slide: function( event, ui ) {
      // update the text value here
    }
  });
});

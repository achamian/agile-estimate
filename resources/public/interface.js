function abracadabra () {
  $(".dont-show")[0].click();
}

$(function() {
  $(".velocity.slider").slider({
    min: 0,
    max: 50,
    value: 10,
    animate: true,
    orientation: "vertical",
     slide: function( event, ui ) {
      $("input#velocity").val(ui.value);
      abracadabra();
    }
  });

  $(".stories.slider").slider({
    min: 0,
    max: 50,
    value: 7,
    animate: true,
    orientation: "vertical",
     slide: function( event, ui ) {
      $("input#stories").val(ui.value);
      abracadabra();
    }
  });


  $("input#velocity").val(10);
  $("input#stories").val(7);
  abracadabra();
});

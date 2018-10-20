$(function(){
  var eClick = (function() {
    if ('ontouchstart' in document.documentElement === true)
      return 'touchstart';
    else
      return 'click';
  })();

  $(document).on(eClick, "#fullscreen", function(e){
    $.when(
      $("#cover").fadeIn("fast")
    ).done(function() {
      $.when(
        $("#iframe-block").addClass("fullscreen")
      ).done(function() {
        $("#cover").fadeOut("fast");
      });
    });
  });

  $(document).on(eClick, "#button-close", function(e){
    e.preventDefault();
    e.stopPropagation();
    $.when(
      $("#cover").fadeIn("fast")
    ).done(function() {
      $.when(
        $("#iframe-block").removeClass("fullscreen")
      ).done(function() {
        $("#cover").fadeOut("fast");
      });
    });
  });
});

var eClick = (function() {
  if ('ontouchstart' in document.documentElement === true)
    return 'touchstart';
  else
    return 'click';
})();


$(function(){
  // Detect user agent & show no-support message if IE
  let userAgent = window.navigator.userAgent.toLowerCase();
  if(userAgent.indexOf('msie') != -1) {
    $("#no-support").addClass("show");
  }

  // when a select box was changed
  $(document).on("change", "select", function(){
    if ($("#select-data").val() === "price") {
      $("#iframe-block").find("iframe").contents().find("#tooltip-table-value").text("価格");
    } else {
      $("#iframe-block").find("iframe").contents().find("#tooltip-table-value").text("騰落率");
    }
  });

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

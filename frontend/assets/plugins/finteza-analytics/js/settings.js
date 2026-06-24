jQuery(document).ready(function($) {
  $(".default-hidden").hide()

  // Open internal text blocks by clicking to the headline
  $(".fz-toggle").click(function() {
    $(this)
      .next()
      .slideToggle(300)
  })

  // Add event for scroll to and open internal text block by clicking to a links
  $(".fz-panel a[data-target]").click(function(e) {
    var panelName = $(this).data("target")
    var $target = $("#fz-panel-" + panelName)

    if ($target.length) {
      e.preventDefault()
      $("html, body").animate({scrollTop: $target.offset().top - 50}, 300)
      $target.find(".toggle").slideDown(300)
    }
  })

  // Save browser UTC Offset to the hidden field
  $("input[name='finteza_register[finteza_offset]']").val(new Date().getTimezoneOffset())

  // Disable registration submit button until user checked/accepted 2 fields
  $("input#finteza_policy, input#finteza_agreement").on("change", function(){
    var submitButton = $(this).parents("form").find("input[type='submit']")
    if (submitButton.length > 0) {
      var policyChecked = $("input#finteza_policy").is(":checked")
      var agreementChecked = $("input#finteza_agreement").is(":checked")
      submitButton.prop("disabled", !(policyChecked && agreementChecked))
    }
  })

  $("input[name='finteza_settings[use_proxy]']").on("change", function () {
    $("input[name='finteza_settings[proxy_token]']").prop("disabled", !$(this).is(":checked"));
  });

  $("input[name='finteza_settings[use_proxy]']").trigger("change");
})

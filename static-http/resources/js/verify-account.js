jQuery(() => {
	function CheckUserID() {
		var val = $('#user-id').val().trim();

		$('#user-id').val(val);
		$('#example-userid-at, #example-userid-url').text(val != '' ? val : 'FindMeWithThis');

		if (val.length == 0) $('#userid-alert').text('The ID can\'t be empty.');
		else if (val.length >= 60) $('#userid-alert').text('The ID is too long.');
		else if (!RSUtils.selectorRegex.test(val)) $('#userid-alert').text('Invalid ID.');
		else $('#userid-alert').text('');
		
		$('#submit-btn').attr('disabled', $('#userid-alert').text() != '');
	}CheckUserID();

	$('#user-id').on('input', CheckUserID);
});

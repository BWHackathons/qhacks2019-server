const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
const CODELEN = 6;

function generateCode()
{
	var code = '';

	for (var i = 0; i < CODELEN; i++) {
		code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
	}
	
	return code;
}


module.exports = {
	generateCode
}
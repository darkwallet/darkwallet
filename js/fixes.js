/*
 * @fileOverview Fixes for frightening things in other libraries
 */

/*
 * Uncached version of apparently very frightening sjcl function
 * (gets called by sjcl.encrypt and sjcl.decrypt)
 * This version:
 *   - adds more bits of salt
 *   - removes password cache
 *   - sanitizes use of obj.iter
 */
sjcl.misc.cachedPbkdf2 = function (password, obj) {
  var iter;
  
  obj = obj || {};
  iter = obj.iter || 1000;
  if (!obj.iter) {
       obj.iter = iter;
  }
  
  obj.salt = obj.salt ? obj.salt.slice(0) : sjcl.random.randomWords(16,0);
  
  var val = sjcl.misc.pbkdf2(password, obj.salt, obj.iter);
  return { key: val.slice(0), salt: obj.salt.slice(0) };
};

'use strict';

define(['backend/channels/utils'], function (ChannelUtils) {

  describe('Protocol format', function() {
    it('hashes the channel names', function() {
        var hash1 = ChannelUtils.hashChannelName("foo");
        var hash2 = ChannelUtils.hashChannelName("blablabla");

        expect(hash1).toBe("8ed9c66c0cc63adfc0b818342045b36846aa7a2ad0087d5421da6a6219540aae");
        expect(hash2).toBe("3f83c1825bb83c07041a6d44cb3d27ab396311215f55382080f9e05e1c73384b");
    });
  });

 
});

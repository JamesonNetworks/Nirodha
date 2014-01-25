
suite('SanityCheck', function() {
  test('Sanity check test, 1 = 1', function() {
  	(1).should.be.exactly(1).and.be.a.Number;
  });
});
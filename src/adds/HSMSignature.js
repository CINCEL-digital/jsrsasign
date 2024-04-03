var graphene = require("graphene-pk11");
var Module = graphene.Module;

if (typeof KJUR === "undefined" || !KJUR) KJUR = {};
if (typeof KJUR.crypto === "undefined" || !KJUR.crypto) KJUR.crypto = {};
if (typeof KJUR.crypto.adds === "undefined" || !KJUR.crypto.adds) KJUR.crypto.adds = {};

KJUR.crypto.adds.HSMSignature = function (params) {
  // const algSign = params.alg;  
  const prov = params.prov.slice(7);
  const modPath = params.provInfo.module;
  const slotPin = params.provInfo.slotPin;
  
  let mod;
  let session;
  let signOper;
  let alg;

  this.params = null;
  if (':SoftHSM:CloudHSM:'.indexOf(prov) === -1)
    throw new Error(`${prov}: provider not implemented`);

  this.setAlgorithm = function () {
    if (params.alg === "SHA256withRSA") alg = "SHA256_RSA_PKCS";
    else if (params.alg === "SHA512withRSA") alg = "SHA512_RSA_PKCS";
    else throw new Error("Signature algorithm no soported");
  };

  this.init = function (pvKey, pass) {
    this.setAlgorithm();

    mod = Module.load(modPath, prov); 

    mod.initialize();

    session = mod.getSlots(0).open();
    session.login(slotPin);

    let keyObject = session
      .find({ 'class': graphene.ObjectClass.PRIVATE_KEY, 'label': pvKey })
      .items(0);
    signOper = session.createSign(alg, keyObject);
  };

  this.updateHex = function (hex) {
    let co = Buffer.from(hex, "hex");
    signOper.update(co);
  };

  this.sign = function () {
    const signature = signOper.final();
    let hexsign = signature.toString("hex"); 

    session.logout();
    mod.finalize();

    return hexsign;
  };
};
extendClass(KJUR.crypto.adds.HSMSignature, KJUR.crypto.Signature);

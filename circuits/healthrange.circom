pragma circom 2.1.6;

include "../backend/node_modules/circomlib/circuits/comparators.circom";

template RangeCheck(bits) {
    signal input value;
    signal input min;
    signal input max;
    signal output ok;

    component greaterEq = GreaterEqThan(bits);
    greaterEq.in[0] <== value;
    greaterEq.in[1] <== min;

    component lessEq = LessEqThan(bits);
    lessEq.in[0] <== value;
    lessEq.in[1] <== max;

    ok <== greaterEq.out * lessEq.out;
}

template HealthRangeProof() {
    signal input value1;
    signal input value2;

    signal input min1;
    signal input max1;
    signal input min2;
    signal input max2;
    signal input checkDual;

    signal output valid;

    checkDual * (checkDual - 1) === 0;

    component firstRange = RangeCheck(32);
    firstRange.value <== value1;
    firstRange.min <== min1;
    firstRange.max <== max1;

    component secondRange = RangeCheck(32);
    secondRange.value <== value2;
    secondRange.min <== min2;
    secondRange.max <== max2;

    signal dualOk;
    dualOk <== (1 - checkDual) + (checkDual * secondRange.ok);

    valid <== firstRange.ok * dualOk;
    valid === 1;
}

component main { public [min1, max1, min2, max2, checkDual] } = HealthRangeProof();

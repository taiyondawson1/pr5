
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PositionSizeCalculator = () => {
  const [balance, setBalance] = useState('10000');
  const [stopLoss, setStopLoss] = useState('50');
  const [pipSize, setPipSize] = useState('0.0001');
  const [riskPercentage, setRiskPercentage] = useState('1');
  const [instrument, setInstrument] = useState('EURUSD');
  const [depositCurrency, setDepositCurrency] = useState('USD');
  const [lotSize, setLotSize] = useState('0');
  const [moneyAtRisk, setMoneyAtRisk] = useState('0');

  const instruments = ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDJPY', 'USDCHF'];
  const currencies = ['USD', 'EUR', 'GBP', 'AUD', 'JPY', 'CHF'];

  const calculatePositionSize = () => {
    const accountBalance = parseFloat(balance);
    const riskAmount = (accountBalance * parseFloat(riskPercentage)) / 100;
    const pipValue = parseFloat(pipSize);
    const stopLossPips = parseFloat(stopLoss);
    
    const calculatedLotSize = (riskAmount / (stopLossPips * pipValue)) / 100000;
    const roundedLotSize = Math.round(calculatedLotSize * 100) / 100;
    
    setLotSize(roundedLotSize.toFixed(2));
    setMoneyAtRisk(riskAmount.toFixed(2));
  };

  return (
    <div className="h-full bg-darkBase/40">
      <div className="p-3 h-full flex flex-col border border-silver/20">
        <h3 className="text-[10px] sm:text-xs font-semibold text-softWhite mb-2">Position Size Calculator</h3>
        
        <div className="grid grid-cols-2 gap-2 flex-grow">
          <div className="space-y-1">
            <label className="text-[10px] text-mediumGray">Instrument</label>
            <Select value={instrument} onValueChange={setInstrument}>
              <SelectTrigger className="w-full h-7 text-[10px]">
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((inst) => (
                  <SelectItem key={inst} value={inst} className="text-[10px]">{inst}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-mediumGray">Deposit Currency</label>
            <Select value={depositCurrency} onValueChange={setDepositCurrency}>
              <SelectTrigger className="w-full h-7 text-[10px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr} value={curr} className="text-[10px]">{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-mediumGray">Account Balance</label>
            <Input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="bg-darkGrey text-softWhite h-7 text-[10px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-mediumGray">Stop Loss (pips)</label>
            <Input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="bg-darkGrey text-softWhite h-7 text-[10px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-mediumGray">Pip Size</label>
            <Input
              type="number"
              value={pipSize}
              onChange={(e) => setPipSize(e.target.value)}
              className="bg-darkGrey text-softWhite h-7 text-[10px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-mediumGray">Risk (%)</label>
            <Input
              type="number"
              value={riskPercentage}
              onChange={(e) => setRiskPercentage(e.target.value)}
              className="bg-darkGrey text-softWhite h-7 text-[10px]"
            />
          </div>
        </div>

        <div className="mt-2">
          <Button 
            onClick={calculatePositionSize}
            className="w-full bg-white text-black hover:bg-white/90 h-7 text-[10px]"
          >
            Calculate
          </Button>

          <div className="mt-2 p-2 border border-silver/20 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-mediumGray">Lot Size:</label>
              <p className="text-[10px] font-semibold text-softWhite">{lotSize}</p>
            </div>
            <div>
              <label className="text-[10px] text-mediumGray">Money at Risk:</label>
              <p className="text-[10px] font-semibold text-softWhite">${moneyAtRisk}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionSizeCalculator;

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const WHATSAPP_NUMBER = "27687597884";
const EFT_BANK = "FNB";
const EFT_ACCOUNT_NAME = "HS FICK T/A THE SNACK MERCHANT";
const EFT_ACCOUNT_NUMBER = "63210867826";
const EFT_BRANCH_CODE = "251145";
const EFT_SWIFT = "FIRNZAJJ";
const EFT_REFERENCE = "Customer Name + Cell";
const DELIVERY_TIERS = [
  { maxKg: 5, fee: 69 },
  { maxKg: 10, fee: 119 },
  { maxKg: 15, fee: 179 },
  { maxKg: 20, fee: 249 },
];

const DELIVERY_METHOD = "PUDO Delivery";
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://snack-merchant-app.onrender.com";

const categories = [
  "All",
  "Nuts & Premium Nuts",
  "Peanuts & Everyday Snacks",
  "Caramelised, Honey & Yoghurt Treats",
  "Dried Fruit & Fruit Snacks",
  "Diced Fruit Range",
  "Seeds & Health Pantry",
  "Chocolate & Candy Treats",
  "Honey, Speciality & Savoury Snacks",
  "Health Mixes & Breakfast Range",
  ];

const catalog = [
  {
    code: "CNL01",
    name: "Almonds Raw NPS",
    category: "Nuts & Premium Nuts",
    desc: "Natural raw almonds perfect for healthy snacking and baking.",
    variants: [
      { size: "1kg", price: 250 },
      { size: "500g", price: 125 },
      { size: "250g", price: 69 },
      { size: "100g", price: 30 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL02",
    name: "Almond Flakes / Ground / Slivered",
    category: "Nuts & Premium Nuts",
    desc: "Ideal for baking, desserts, cereals and toppings.",
    variants: [
      { size: "1kg", price: 304 },
      { size: "500g", price: 152 },
      { size: "250g", price: 80 },
      { size: "100g", price: 34 },
      { size: "50g", price: 23 },
    ],
  },
  {
    code: "CNL03",
    name: "Almond Sprinkles / Nibs",
    category: "Nuts & Premium Nuts",
    desc: "Crunchy almond pieces perfect for desserts and baking.",
    variants: [
      { size: "1kg", price: 304 },
      { size: "500g", price: 152 },
      { size: "250g", price: 80 },
      { size: "100g", price: 34 },
      { size: "50g", price: 23 },
    ],
  },
  {
    code: "CNL04",
    name: "Almonds Coloured",
    category: "Nuts & Premium Nuts",
    desc: "Candy-coated almonds ideal for gifting and celebrations.",
    variants: [
      { size: "1kg", price: 365 },
      { size: "500g", price: 182 },
      { size: "250g", price: 97 },
      { size: "100g", price: 43 },
      { size: "50g", price: 25 },
    ],
  },
  {
    code: "CNL05",
    name: "Almonds Roasted Salted",
    category: "Nuts & Premium Nuts",
    desc: "Classic roasted salted almonds with rich nutty flavour.",
    variants: [
      { size: "1kg", price: 243 },
      { size: "500g", price: 122 },
      { size: "250g", price: 65 },
      { size: "100g", price: 30 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL06",
    name: "Brazil Nuts Pieces",
    category: "Nuts & Premium Nuts",
    desc: "Premium Brazil nut pieces rich in flavour and nutrients.",
    variants: [
      { size: "1kg", price: 412 },
      { size: "500g", price: 206 },
      { size: "250g", price: 108 },
      { size: "100g", price: 45 },
      { size: "50g", price: 24 },
    ],
  },
  {
    code: "CNL07",
    name: "Cashews Split Scorched",
    category: "Nuts & Premium Nuts",
    desc: "Crunchy roasted cashew pieces perfect for everyday snacking.",
    variants: [
      { size: "1kg", price: 207 },
      { size: "500g", price: 103 },
      { size: "250g", price: 55 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL08",
    name: "Cashews Whole Raw / Salted / Peri-Peri",
    category: "Nuts & Premium Nuts",
    desc: "Premium whole cashews available in classic and flavoured options.",
    variants: [
      { size: "1kg", price: 257 },
      { size: "500g", price: 128 },
      { size: "250g", price: 71 },
      { size: "100g", price: 32 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL09",
    name: "Cashews Zesty Lime & Sea Salt",
    category: "Nuts & Premium Nuts",
    desc: "Tangy lime and sea salt cashews with bold flavour.",
    variants: [
      { size: "1kg", price: 257 },
      { size: "500g", price: 128 },
      { size: "250g", price: 71 },
      { size: "100g", price: 32 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL10",
    name: "Cashews BBQ",
    category: "Nuts & Premium Nuts",
    desc: "Smoky BBQ flavoured cashews perfect for entertaining.",
    variants: [
      { size: "1kg", price: 257 },
      { size: "500g", price: 128 },
      { size: "250g", price: 71 },
      { size: "100g", price: 32 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL11",
    name: "Cashews Cream Cheese & Chives",
    category: "Nuts & Premium Nuts",
    desc: "Creamy savoury cashews with rich herb flavour.",
    variants: [
      { size: "1kg", price: 257 },
      { size: "500g", price: 128 },
      { size: "250g", price: 71 },
      { size: "100g", price: 32 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL12",
    name: "Giant Redskin Peanuts",
    category: "Nuts & Premium Nuts",
    desc: "Traditional roasted redskin peanuts full of flavour.",
    variants: [
      { size: "1kg", price: 88 },
      { size: "500g", price: 44 },
      { size: "250g", price: 27 },
      { size: "100g", price: 14 },
      { size: "50g", price: 8 },
    ],
  },
  {
    code: "CNL13",
    name: "Hazelnuts Natural Skin",
    category: "Nuts & Premium Nuts",
    desc: "Premium hazelnuts ideal for snacking and baking.",
    variants: [
      { size: "1kg", price: 486 },
      { size: "500g", price: 243 },
      { size: "250g", price: 128 },
      { size: "100g", price: 54 },
      { size: "50g", price: 31 },
    ],
  },
  {
    code: "CNL14",
    name: "Hazelnuts Blanched",
    category: "Nuts & Premium Nuts",
    desc: "Smooth blanched hazelnuts perfect for desserts and platters.",
    variants: [
      { size: "1kg", price: 668 },
      { size: "500g", price: 334 },
      { size: "250g", price: 167 },
      { size: "100g", price: 74 },
      { size: "50g", price: 43 },
    ],
  },
  {
    code: "CNL15",
    name: "Health Fanatic",
    category: "Nuts & Premium Nuts",
    desc: "Healthy nut and fruit blend packed with flavour and nutrition.",
    variants: [
      { size: "1kg", price: 216 },
      { size: "500g", price: 108 },
      { size: "250g", price: 59 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL16",
    name: "Nutty Remix",
    category: "Nuts & Premium Nuts",
    desc: "Delicious mixed nut snack blend for everyday enjoyment.",
    variants: [
      { size: "1kg", price: 216 },
      { size: "500g", price: 108 },
      { size: "250g", price: 59 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL17",
    name: "Macadamia & Cranberry Mix",
    category: "Nuts & Premium Nuts",
    desc: "Sweet and crunchy premium macadamia and cranberry blend.",
    variants: [
      { size: "1kg", price: 230 },
      { size: "500g", price: 115 },
      { size: "250g", price: 61 },
      { size: "100g", price: 26 },
      { size: "50g", price: 14 },
    ],
  },
  {
    code: "CNL18",
    name: "Macadamia Halves",
    category: "Nuts & Premium Nuts",
    desc: "Premium buttery macadamia halves for healthy snacking.",
    variants: [
      { size: "1kg", price: 243 },
      { size: "500g", price: 122 },
      { size: "250g", price: 65 },
      { size: "100g", price: 30 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL19",
    name: "Macadamia Pieces",
    category: "Nuts & Premium Nuts",
    desc: "Crunchy macadamia pieces ideal for cereals and baking.",
    variants: [
      { size: "1kg", price: 230 },
      { size: "500g", price: 115 },
      { size: "250g", price: 61 },
      { size: "100g", price: 26 },
      { size: "50g", price: 14 },
    ],
  },
  {
    code: "CNL20",
    name: "Macadamia Pieces Salted",
    category: "Nuts & Premium Nuts",
    desc: "Salted macadamia pieces with rich buttery flavour.",
    variants: [
      { size: "1kg", price: 284 },
      { size: "500g", price: 142 },
      { size: "250g", price: 78 },
      { size: "100g", price: 35 },
      { size: "50g", price: 20 },
    ],
  },
  {
    code: "CNL21",
    name: "Macadamia Whole Plain",
    category: "Nuts & Premium Nuts",
    desc: "Whole premium macadamias perfect for gifting and platters.",
    variants: [
      { size: "1kg", price: 284 },
      { size: "500g", price: 142 },
      { size: "250g", price: 78 },
      { size: "100g", price: 35 },
      { size: "50g", price: 20 },
    ],
  },
  {
    code: "CNL22",
    name: "Mixed Nuts Raw",
    category: "Nuts & Premium Nuts",
    desc: "Healthy raw mixed nuts ideal for snacking and meal prep.",
    variants: [
      { size: "1kg", price: 270 },
      { size: "500g", price: 135 },
      { size: "250g", price: 74 },
      { size: "100g", price: 34 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL23",
    name: "Mixed Nuts Roasted Salted",
    category: "Nuts & Premium Nuts",
    desc: "Premium roasted mixed nuts with savoury crunch.",
    variants: [
      { size: "1kg", price: 277 },
      { size: "500g", price: 138 },
      { size: "250g", price: 76 },
      { size: "100g", price: 34 },
      { size: "50g", price: 20 },
    ],
  },
  {
    code: "CNL24",
    name: "Peanuts Blanched Raw / Salted / Peri-Peri",
    category: "Peanuts & Everyday Snacks",
    desc: "Classic peanuts available raw, salted or spicy peri-peri.",
    variants: [
      { size: "1kg", price: 97 },
      { size: "500g", price: 51 },
      { size: "250g", price: 34 },
      { size: "100g", price: 14 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL25",
    name: "Peanuts BBQ / Tomato Chilli",
    category: "Peanuts & Everyday Snacks",
    desc: "Bold flavoured peanuts with smoky BBQ and chilli seasoning.",
    variants: [
      { size: "1kg", price: 97 },
      { size: "500g", price: 51 },
      { size: "250g", price: 34 },
      { size: "100g", price: 14 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL26",
    name: "Peanuts Redskin Salted / Peri-Peri",
    category: "Peanuts & Everyday Snacks",
    desc: "Traditional redskin peanuts with savoury or spicy flavour.",
    variants: [
      { size: "1kg", price: 81 },
      { size: "500g", price: 44 },
      { size: "250g", price: 24 },
      { size: "100g", price: 12 },
      { size: "50g", price: 8 },
    ],
  },
  {
    code: "CNL27",
    name: "Peanuts & Raisins Mix",
    category: "Peanuts & Everyday Snacks",
    desc: "Sweet and savoury peanut and raisin combination.",
    variants: [
      { size: "1kg", price: 97 },
      { size: "500g", price: 51 },
      { size: "250g", price: 34 },
      { size: "100g", price: 14 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL28",
    name: "Pecan Halves",
    category: "Nuts & Premium Nuts",
    desc: "Rich buttery pecans perfect for baking and snacking.",
    variants: [
      { size: "1kg", price: 243 },
      { size: "500g", price: 122 },
      { size: "250g", price: 65 },
      { size: "100g", price: 30 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL29",
    name: "Pecan Pieces A-Grade",
    category: "Nuts & Premium Nuts",
    desc: "Crunchy pecan pieces ideal for desserts and cereals.",
    variants: [
      { size: "1kg", price: 230 },
      { size: "500g", price: 115 },
      { size: "250g", price: 61 },
      { size: "100g", price: 26 },
      { size: "50g", price: 14 },
    ],
  },
  {
    code: "CNL30",
    name: "Pistachio Cleaned Kernels",
    category: "Nuts & Premium Nuts",
    desc: "Premium pistachio kernels with rich nutty flavour.",
    variants: [
      { size: "1kg", price: 668 },
      { size: "500g", price: 334 },
      { size: "250g", price: 167 },
      { size: "100g", price: 74 },
      { size: "50g", price: 43 },
    ],
  },
  {
    code: "CNL31",
    name: "Pistachio in Shell",
    category: "Nuts & Premium Nuts",
    desc: "Classic pistachios in shell for premium snacking.",
    variants: [
      { size: "1kg", price: 385 },
      { size: "500g", price: 192 },
      { size: "250g", price: 101 },
      { size: "100g", price: 43 },
      { size: "50g", price: 27 },
    ],
  },
  {
    code: "CNL32",
    name: "Pistachio Slivered",
    category: "Nuts & Premium Nuts",
    desc: "Slivered pistachios perfect for gourmet baking and platters.",
    variants: [
      { size: "1kg", price: 1283 },
      { size: "500g", price: 675 },
      { size: "250g", price: 385 },
      { size: "100g", price: 135 },
      { size: "50g", price: 74 },
    ],
  },
  {
    code: "CNL33",
    name: "Walnuts",
    category: "Nuts & Premium Nuts",
    desc: "Nutritious walnuts ideal for healthy lifestyles and baking.",
    variants: [
      { size: "1kg", price: 270 },
      { size: "500g", price: 135 },
      { size: "250g", price: 74 },
      { size: "100g", price: 34 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL34",
    name: "Caramelized Almonds",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Crunchy caramel-coated almonds with sweet golden flavour.",
    variants: [
      { size: "1kg", price: 297 },
      { size: "500g", price: 149 },
      { size: "250g", price: 77 },
      { size: "100g", price: 32 },
      { size: "50g", price: 22 },
    ],
  },
  {
    code: "CNL35",
    name: "Caramelized Cashews",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Premium cashews coated in delicious caramel glaze.",
    variants: [
      { size: "1kg", price: 304 },
      { size: "500g", price: 152 },
      { size: "250g", price: 80 },
      { size: "100g", price: 34 },
      { size: "50g", price: 23 },
    ],
  },
  {
    code: "CNL36",
    name: "Caramelized Sesame Seed Cashews",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Sweet caramelized cashews finished with sesame crunch.",
    variants: [
      { size: "1kg", price: 263 },
      { size: "500g", price: 132 },
      { size: "250g", price: 73 },
      { size: "100g", price: 35 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL37",
    name: "Caramelized Giant Peanuts",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Large crunchy peanuts coated in sweet caramel.",
    variants: [
      { size: "1kg", price: 108 },
      { size: "500g", price: 54 },
      { size: "250g", price: 34 },
      { size: "100g", price: 16 },
      { size: "50g", price: 11 },
    ],
  },
  {
    code: "CNL38",
    name: "Caramelized Macadamia",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Luxury caramelized macadamias with buttery sweetness.",
    variants: [
      { size: "1kg", price: 331 },
      { size: "500g", price: 165 },
      { size: "250g", price: 84 },
      { size: "100g", price: 34 },
      { size: "50g", price: 20 },
    ],
  },
  {
    code: "CNL39",
    name: "Caramelized Mixed Nuts",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Mixed nut blend coated in rich caramel flavour.",
    variants: [
      { size: "1kg", price: 243 },
      { size: "500g", price: 122 },
      { size: "250g", price: 65 },
      { size: "100g", price: 30 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL40",
    name: "Caramelized Pecans",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Premium pecans coated in crunchy caramel glaze.",
    variants: [
      { size: "1kg", price: 344 },
      { size: "500g", price: 172 },
      { size: "250g", price: 88 },
      { size: "100g", price: 38 },
      { size: "50g", price: 23 },
    ],
  },
  {
    code: "CNL41",
    name: "Caramelized Small Peanuts",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Sweet caramelized peanuts ideal for snacking and sharing.",
    variants: [
      { size: "1kg", price: 108 },
      { size: "500g", price: 54 },
      { size: "250g", price: 34 },
      { size: "100g", price: 16 },
      { size: "50g", price: 11 },
    ],
  },
  {
    code: "CNL42",
    name: "Salted Caramelized Cashews",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Sweet and salty caramelized cashews with rich flavour.",
    variants: [
      { size: "1kg", price: 304 },
      { size: "500g", price: 152 },
      { size: "250g", price: 80 },
      { size: "100g", price: 34 },
      { size: "50g", price: 23 },
    ],
  },
  {
    code: "CNL43",
    name: "Salted Caramelized Macadamia",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Premium salted caramel macadamias with buttery crunch.",
    variants: [
      { size: "1kg", price: 331 },
      { size: "500g", price: 165 },
      { size: "250g", price: 84 },
      { size: "100g", price: 34 },
      { size: "50g", price: 20 },
    ],
  },
  {
    code: "CNL44",
    name: "Salted Caramelized Mixed Nuts No Peanuts",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Luxury mixed nuts with sweet salted caramel coating.",
    variants: [
      { size: "1kg", price: 317 },
      { size: "500g", price: 159 },
      { size: "250g", price: 81 },
      { size: "100g", price: 32 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL45",
    name: "Salted Caramelized Peanuts",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Classic salted caramel peanuts for sweet snacking.",
    variants: [
      { size: "1kg", price: 108 },
      { size: "500g", price: 54 },
      { size: "250g", price: 34 },
      { size: "100g", price: 16 },
      { size: "50g", price: 11 },
    ],
  },
  {
    code: "CNL46",
    name: "Honey Roasted Almonds",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Crunchy almonds coated in golden honey flavour.",
    variants: [
      { size: "1kg", price: 297 },
      { size: "500g", price: 149 },
      { size: "250g", price: 77 },
      { size: "100g", price: 32 },
      { size: "50g", price: 22 },
    ],
  },
  {
    code: "CNL47",
    name: "Honey Roasted Cashews",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Sweet honey roasted cashews perfect for gifting and treats.",
    variants: [
      { size: "1kg", price: 304 },
      { size: "500g", price: 152 },
      { size: "250g", price: 80 },
      { size: "100g", price: 34 },
      { size: "50g", price: 23 },
    ],
  },
  {
    code: "CNL48",
    name: "Honey Roasted Mixed Nuts No Peanuts",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Premium mixed nuts with sweet honey roasted finish.",
    variants: [
      { size: "1kg", price: 317 },
      { size: "500g", price: 159 },
      { size: "250g", price: 81 },
      { size: "100g", price: 32 },
      { size: "50g", price: 17 },
    ],
  },
  {
    code: "CNL49",
    name: "Honey Roasted Peanuts",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Classic honey roasted peanuts with sweet crunchy coating.",
    variants: [
      { size: "1kg", price: 122 },
      { size: "500g", price: 61 },
      { size: "250g", price: 38 },
      { size: "100g", price: 20 },
      { size: "50g", price: 11 },
    ],
  },
  {
    code: "CNL50",
    name: "Honey Roasted Banana Chips",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Sweet crunchy banana chips with honey flavour.",
    variants: [
      { size: "1kg", price: 175 },
      { size: "500g", price: 88 },
      { size: "250g", price: 49 },
      { size: "100g", price: 20 },
      { size: "50g", price: 10 },
    ],
  },
  {
    code: "CNL51",
    name: "Yoghurt Cashews",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Creamy yoghurt-coated cashews with sweet indulgent flavour.",
    variants: [
      { size: "1kg", price: 263 },
      { size: "500g", price: 132 },
      { size: "250g", price: 73 },
      { size: "100g", price: 35 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL52",
    name: "Yoghurt Lemon Cashews",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Tangy lemon yoghurt cashews with refreshing sweetness.",
    variants: [
      { size: "1kg", price: 263 },
      { size: "500g", price: 132 },
      { size: "250g", price: 73 },
      { size: "100g", price: 35 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL53",
    name: "Yoghurt Strawberry Cashews",
    category: "Caramelised, Honey & Yoghurt Treats",
    desc: "Strawberry yoghurt cashews perfect for sweet snacking.",
    variants: [
      { size: "1kg", price: 263 },
      { size: "500g", price: 132 },
      { size: "250g", price: 73 },
      { size: "100g", price: 35 },
      { size: "50g", price: 18 },
    ],
  },
    {
    code: "CNL54",
    name: "Apple Rings",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Sulphur-free Pink Lady apple rings for healthy snacking.",
    variants: [
      { size: "1kg", price: 432 },
      { size: "500g", price: 216 },
      { size: "250g", price: 115 },
      { size: "100g", price: 50 },
      { size: "50g", price: 28 },
    ],
  },
  {
    code: "CNL55",
    name: "Coconut Flakes",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Crunchy coconut flakes ideal for cereals, baking and smoothies.",
    variants: [
      { size: "1kg", price: 236 },
      { size: "500g", price: 118 },
      { size: "250g", price: 61 },
      { size: "100g", price: 27 },
      { size: "50g", price: 16 },
    ],
  },
  {
    code: "CNL56",
    name: "Coconut Desiccated",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Fine desiccated coconut perfect for baking and desserts.",
    variants: [
      { size: "1kg", price: 103 },
      { size: "500g", price: 55 },
      { size: "250g", price: 30 },
      { size: "100g", price: 16 },
      { size: "50g", price: 8 },
    ],
  },
  {
    code: "CNL57",
    name: "Cranberries",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Sweet dried cranberries for snacking, salads and baking.",
    variants: [
      { size: "1kg", price: 230 },
      { size: "500g", price: 115 },
      { size: "250g", price: 61 },
      { size: "100g", price: 26 },
      { size: "50g", price: 14 },
    ],
  },
  {
    code: "CNL58",
    name: "Dried Fruit Mango Cheeks Imported",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Premium imported mango cheeks with tropical sweetness.",
    variants: [
      { size: "1kg", price: 446 },
      { size: "500g", price: 223 },
      { size: "250g", price: 119 },
      { size: "100g", price: 54 },
      { size: "50g", price: 29 },
    ],
  },
  {
    code: "CNL59",
    name: "Dried Fruit Mango Chunks A-Grade",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Soft mango chunks ideal for sweet healthy snacking.",
    variants: [
      { size: "1kg", price: 331 },
      { size: "500g", price: 165 },
      { size: "250g", price: 84 },
      { size: "100g", price: 34 },
      { size: "50g", price: 20 },
    ],
  },
  {
    code: "CNL60",
    name: "Dried Fruit Mango Strips A-Grade",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Premium mango strips packed with tropical flavour.",
    variants: [
      { size: "1kg", price: 412 },
      { size: "500g", price: 206 },
      { size: "250g", price: 108 },
      { size: "100g", price: 45 },
      { size: "50g", price: 24 },
    ],
  },
  {
    code: "CNL61",
    name: "Dried Fruit Mixed",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Classic mixed dried fruit blend including apples, peaches and apricots.",
    variants: [
      { size: "1kg", price: 189 },
      { size: "500g", price: 95 },
      { size: "250g", price: 52 },
      { size: "100g", price: 20 },
      { size: "50g", price: 11 },
    ],
  },
  {
    code: "CNL62",
    name: "Dried Fruit Peaches",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Naturally sweet dried peaches for healthy snacking.",
    variants: [
      { size: "1kg", price: 209 },
      { size: "500g", price: 105 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 15 },
    ],
  },
  {
    code: "CNL63",
    name: "Peeled Fruit Pear",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Soft dried pear pieces with natural sweetness.",
    variants: [
      { size: "1kg", price: 209 },
      { size: "500g", price: 105 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 15 },
    ],
  },
  {
    code: "CNL64",
    name: "Dried Fruit Turkish Apricots",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Premium Turkish apricots for snacking and platters.",
    variants: [
      { size: "1kg", price: 304 },
      { size: "500g", price: 152 },
      { size: "250g", price: 80 },
      { size: "100g", price: 34 },
      { size: "50g", price: 23 },
    ],
  },
  {
    code: "CNL65",
    name: "Dried Fruit Turkish Figs",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Sweet Turkish figs with rich chewy texture.",
    variants: [
      { size: "1kg", price: 277 },
      { size: "500g", price: 138 },
      { size: "250g", price: 76 },
      { size: "100g", price: 32 },
      { size: "50g", price: 20 },
    ],
  },
  {
    code: "CNL66",
    name: "Fruit Flakes",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Colourful fruit flakes for cereals, baking and toppings.",
    variants: [
      { size: "1kg", price: 169 },
      { size: "500g", price: 84 },
      { size: "250g", price: 47 },
      { size: "100g", price: 22 },
      { size: "50g", price: 11 },
    ],
  },
  {
    code: "CNL67",
    name: "Goji Berries",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Superfood goji berries packed with flavour and nutrition.",
    variants: [
      { size: "1kg", price: 452 },
      { size: "500g", price: 226 },
      { size: "250g", price: 122 },
      { size: "100g", price: 59 },
      { size: "50g", price: 36 },
    ],
  },
  {
    code: "CNL68",
    name: "Luxurious Fruit Cake Mix",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Premium fruit cake mix for baking and festive treats.",
    variants: [
      { size: "1kg", price: 142 },
      { size: "500g", price: 71 },
      { size: "250g", price: 41 },
      { size: "100g", price: 17 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL69",
    name: "Mini Fruit Rolls",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Mini fruit rolls available in raspberry or strawberry.",
    variants: [
      { size: "24 Pack", price: 78 },
      { size: "12 Pack", price: 38 },
      { size: "5 Pack", price: 17 },
    ],
  },
  {
    code: "CNL70",
    name: "Mixed Medley Dried Fruit Strips",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Mixed dried fruit strips with sweet tropical flavour.",
    variants: [
      { size: "1kg", price: 182 },
      { size: "500g", price: 91 },
      { size: "250g", price: 50 },
      { size: "100g", price: 22 },
      { size: "50g", price: 11 },
    ],
  },
  {
    code: "CNL71",
    name: "Mebos Lollies Plain",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Traditional plain mebos lollies with tangy fruit flavour.",
    variants: [
      { size: "1kg", price: 128 },
      { size: "500g", price: 64 },
      { size: "250g", price: 36 },
      { size: "100g", price: 16 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL72",
    name: "Mebos Lollies Sugared",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Sugared mebos lollies for nostalgic sweet snacking.",
    variants: [
      { size: "1kg", price: 128 },
      { size: "500g", price: 64 },
      { size: "250g", price: 36 },
      { size: "100g", price: 16 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL73",
    name: "Pitted Dates",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Soft pitted dates for snacking, smoothies and baking.",
    variants: [
      { size: "1kg", price: 74 },
      { size: "500g", price: 37 },
    ],
  },
  {
    code: "CNL74",
    name: "Pitted Prunes",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Naturally sweet pitted prunes with chewy texture.",
    variants: [
      { size: "1kg", price: 209 },
      { size: "500g", price: 105 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 15 },
    ],
  },
  {
    code: "CNL75",
    name: "Seedless Raisins",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Classic seedless raisins for baking and everyday snacking.",
    variants: [
      { size: "1kg", price: 149 },
      { size: "500g", price: 74 },
      { size: "250g", price: 43 },
      { size: "100g", price: 18 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL76",
    name: "Sugared Fruit Cubes",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Colourful sugared fruit cubes for baking and treats.",
    variants: [
      { size: "1kg", price: 135 },
      { size: "500g", price: 68 },
      { size: "250g", price: 38 },
      { size: "100g", price: 19 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL77",
    name: "Sugared Fruit Lollies",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Sweet fruity lollies ideal for kids and party packs.",
    variants: [
      { size: "1kg", price: 135 },
      { size: "500g", price: 68 },
      { size: "250g", price: 38 },
      { size: "100g", price: 19 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL78",
    name: "Sultanas",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Sweet sultanas for cereals, baking and snacking.",
    variants: [
      { size: "1kg", price: 149 },
      { size: "500g", price: 74 },
      { size: "250g", price: 43 },
      { size: "100g", price: 18 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL79",
    name: "Tropical Mix",
    category: "Dried Fruit & Fruit Snacks",
    desc: "Tropical fruit mix with sweet exotic flavours.",
    variants: [
      { size: "1kg", price: 263 },
      { size: "500g", price: 132 },
      { size: "250g", price: 73 },
      { size: "100g", price: 35 },
      { size: "50g", price: 18 },
    ],
  },
    {
    code: "CNL80",
    name: "Diced Berry Mix",
    category: "Diced Fruit Range",
    desc: "Colourful berry fruit cubes for snacking, baking and toppings.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL81",
    name: "Diced Blueberry",
    category: "Diced Fruit Range",
    desc: "Sweet blueberry fruit cubes packed with fruity flavour.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL82",
    name: "Diced Citrus Mix",
    category: "Diced Fruit Range",
    desc: "Tangy citrus fruit cubes ideal for baking and desserts.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL83",
    name: "Diced Fruit Mixed",
    category: "Diced Fruit Range",
    desc: "Mixed tropical diced fruit blend with kiwi, strawberry, papaya and pineapple.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL84",
    name: "Diced Gooseberry",
    category: "Diced Fruit Range",
    desc: "Sweet diced gooseberry pieces with vibrant fruity flavour.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL85",
    name: "Diced Greenberry",
    category: "Diced Fruit Range",
    desc: "Colourful greenberry cubes perfect for baking and sweet treats.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL86",
    name: "Diced Kiwi",
    category: "Diced Fruit Range",
    desc: "Sweet kiwi cubes ideal for baking, toppings and desserts.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL87",
    name: "Diced Papaya",
    category: "Diced Fruit Range",
    desc: "Soft papaya cubes packed with tropical sweetness.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL88",
    name: "Diced Passion Fruit",
    category: "Diced Fruit Range",
    desc: "Tangy passion fruit cubes for desserts, baking and snacking.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL89",
    name: "Diced Pineapple",
    category: "Diced Fruit Range",
    desc: "Sweet pineapple cubes with juicy tropical flavour.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL90",
    name: "Diced Strawberry",
    category: "Diced Fruit Range",
    desc: "Sweet strawberry fruit cubes for baking, desserts and treats.",
    variants: [
      { size: "1kg", price: 203 },
      { size: "500g", price: 101 },
      { size: "250g", price: 54 },
      { size: "100g", price: 24 },
      { size: "50g", price: 12 },
    ],
  },
  {
    code: "CNL91",
    name: "Chia Seeds",
    category: "Seeds & Health Pantry",
    desc: "Nutrient-rich chia seeds for smoothies, breakfast bowls and baking.",
    variants: [
      { size: "1kg", price: 223 },
      { size: "500g", price: 111 },
      { size: "250g", price: 61 },
      { size: "100g", price: 27 },
      { size: "50g", price: 15 },
    ],
  },
  {
    code: "CNL92",
    name: "Flax Seeds",
    category: "Seeds & Health Pantry",
    desc: "Healthy flax seeds ideal for cereals, smoothies and baking.",
    variants: [
      { size: "1kg", price: 103 },
      { size: "500g", price: 55 },
      { size: "250g", price: 30 },
      { size: "100g", price: 16 },
      { size: "50g", price: 8 },
    ],
  },
  {
    code: "CNL93",
    name: "Mixed Seeds",
    category: "Seeds & Health Pantry",
    desc: "Mixed chia, sesame, pumpkin and sunflower seeds for everyday wellness.",
    variants: [
      { size: "1kg", price: 163 },
      { size: "500g", price: 82 },
      { size: "250g", price: 47 },
      { size: "100g", price: 20 },
      { size: "50g", price: 10 },
    ],
  },
  {
    code: "CNL94",
    name: "Pumpkin Seeds",
    category: "Seeds & Health Pantry",
    desc: "Crunchy pumpkin seeds packed with flavour and nutrients.",
    variants: [
      { size: "1kg", price: 236 },
      { size: "500g", price: 118 },
      { size: "250g", price: 61 },
      { size: "100g", price: 27 },
      { size: "50g", price: 16 },
    ],
  },
  {
    code: "CNL95",
    name: "Rolled Oats",
    category: "Seeds & Health Pantry",
    desc: "Classic rolled oats for breakfast, baking and healthy meals.",
    variants: [
      { size: "1kg", price: 68 },
      { size: "500g", price: 36 },
    ],
  },
  {
    code: "CNL96",
    name: "Sesame Seeds",
    category: "Seeds & Health Pantry",
    desc: "Sesame seeds for baking, cooking, toppings and salads.",
    variants: [
      { size: "1kg", price: 155 },
      { size: "500g", price: 78 },
      { size: "250g", price: 43 },
      { size: "100g", price: 19 },
      { size: "50g", price: 10 },
    ],
  },
  {
    code: "CNL97",
    name: "Sesame Seeds Coloured",
    category: "Seeds & Health Pantry",
    desc: "Colourful sesame seeds for baking, decorating and gourmet dishes.",
    variants: [
      { size: "1kg", price: 189 },
      { size: "500g", price: 95 },
      { size: "250g", price: 52 },
      { size: "100g", price: 20 },
      { size: "50g", price: 11 },
    ],
  },
  {
    code: "CNL98",
    name: "Sunflower Seeds",
    category: "Seeds & Health Pantry",
    desc: "Healthy sunflower seeds ideal for salads, baking and snacking.",
    variants: [
      { size: "1kg", price: 103 },
      { size: "500g", price: 55 },
      { size: "250g", price: 30 },
      { size: "100g", price: 16 },
      { size: "50g", price: 8 },
    ],
  },
  {
    code: "CNL99",
    name: "Chocolate Biscuits",
    category: "Chocolate & Candy Treats",
    desc: "Crunchy chocolate-coated biscuit bites for sweet snacking.",
    variants: [
      { size: "1kg", price: 163 },
      { size: "500g", price: 82 },
      { size: "250g", price: 47 },
      { size: "100g", price: 20 },
      { size: "50g", price: 10 },
    ],
  },
  {
    code: "CNL100",
    name: "Chocolate Peanuts",
    category: "Chocolate & Candy Treats",
    desc: "Crunchy peanuts coated in smooth chocolate.",
    variants: [
      { size: "1kg", price: 163 },
      { size: "500g", price: 82 },
      { size: "250g", price: 47 },
      { size: "100g", price: 20 },
      { size: "50g", price: 10 },
    ],
  },
  {
    code: "CNL101",
    name: "Chocolate Raisins",
    category: "Chocolate & Candy Treats",
    desc: "Juicy raisins coated in creamy chocolate goodness.",
    variants: [
      { size: "1kg", price: 163 },
      { size: "500g", price: 82 },
      { size: "250g", price: 47 },
      { size: "100g", price: 20 },
      { size: "50g", price: 10 },
    ],
  },
  {
    code: "CNL102",
    name: "Chocolate Cashews",
    category: "Chocolate & Candy Treats",
    desc: "Premium chocolate-coated cashews with rich indulgent flavour.",
    variants: [
      { size: "1kg", price: 263 },
      { size: "500g", price: 132 },
      { size: "250g", price: 73 },
      { size: "100g", price: 35 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL103",
    name: "Giant Astros",
    category: "Chocolate & Candy Treats",
    desc: "Colourful chocolate candy treats for parties, kids and sharing.",
    variants: [
      { size: "1kg", price: 163 },
      { size: "500g", price: 82 },
      { size: "250g", price: 47 },
      { size: "100g", price: 20 },
      { size: "50g", price: 10 },
    ],
  },
  {
    code: "CNL104",
    name: "Giant Speckled Eggs",
    category: "Chocolate & Candy Treats",
    desc: "Candy-coated chocolate eggs ideal for gifting and sharing.",
    variants: [
      { size: "1kg", price: 163 },
      { size: "500g", price: 82 },
      { size: "250g", price: 47 },
      { size: "100g", price: 20 },
      { size: "50g", price: 10 },
    ],
  },
  {
    code: "CNL105",
    name: "Chocolate Macadamia",
    category: "Chocolate & Candy Treats",
    desc: "Luxury chocolate-covered macadamias with buttery crunch.",
    variants: [
      { size: "1kg", price: 324 },
      { size: "500g", price: 162 },
      { size: "250g", price: 84 },
      { size: "100g", price: 34 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL106",
    name: "Cocoa Dusted Almonds",
    category: "Chocolate & Candy Treats",
    desc: "Cocoa-dusted almonds with rich gourmet chocolate flavour.",
    variants: [
      { size: "1kg", price: 324 },
      { size: "500g", price: 162 },
      { size: "250g", price: 84 },
      { size: "100g", price: 34 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL107",
    name: "Milkybar Almonds",
    category: "Chocolate & Candy Treats",
    desc: "Creamy white chocolate almonds for sweet indulgence.",
    variants: [
      { size: "1kg", price: 324 },
      { size: "500g", price: 162 },
      { size: "250g", price: 84 },
      { size: "100g", price: 34 },
      { size: "50g", price: 18 },
    ],
  },
  {
    code: "CNL108",
    name: "Pink and White Almonds",
    category: "Chocolate & Candy Treats",
    desc: "Classic candy-coated almonds for celebrations and gifting.",
    variants: [
      { size: "1kg", price: 286 },
      { size: "500g", price: 143 },
      { size: "250g", price: 74 },
      { size: "100g", price: 33 },
      { size: "50g", price: 20 },
    ],
  },
  {
    code: "CNL109",
    name: "Pink and White Peanuts",
    category: "Chocolate & Candy Treats",
    desc: "Sweet candy-coated peanuts for parties, treats and sharing.",
    variants: [
      { size: "1kg", price: 135 },
      { size: "500g", price: 68 },
      { size: "250g", price: 38 },
      { size: "100g", price: 19 },
      { size: "50g", price: 9 },
    ],
  },
  {
    code: "CNL110",
    name: "Pink and White Cachous",
    category: "Chocolate & Candy Treats",
    desc: "Traditional crunchy candy treats with nostalgic flavour.",
    variants: [
      { size: "1kg", price: 89 },
      { size: "500g", price: 54 },
    ],
  },
  {
    code: "CNL111",
    name: "Squeeze Bottle Honey",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Pure local honey in an easy-to-use squeeze bottle.",
    variants: [
      { size: "500g", price: 101 },
    ],
  },
  {
    code: "CNL112",
    name: "CrazyBee Local Honey Bucket",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Large family-size bucket of premium local honey.",
    variants: [
      { size: "1.4kg", price: 270 },
    ],
  },
  {
    code: "CNL113",
    name: "CrazyBee Local Honey Glass Bottle",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Premium local honey in elegant glass packaging.",
    variants: [
      { size: "500g", price: 115 },
    ],
  },
  {
    code: "CNL115",
    name: "Chevro",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Traditional savoury snack mix ideal for entertaining.",
    variants: [
      { size: "1kg", price: 243 },
      { size: "500g", price: 122 },
      { size: "300g", price: 79 },
    ],
  },
  {
    code: "CNL116",
    name: "Murku Plain / Spring Onion",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Crunchy traditional savoury snack with authentic flavour.",
    variants: [
      { size: "Pack", price: 41 },
    ],
  },
  {
    code: "CNL117",
    name: "Sev and Nuts Plain / Hot",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Classic savoury sev snack mix with crunchy nuts.",
    variants: [
      { size: "Pack", price: 41 },
    ],
  },
  {
    code: "CNL118",
    name: "Sev Plain Without Nuts",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Traditional crunchy sev snack perfect for sharing.",
    variants: [
      { size: "Pack", price: 41 },
    ],
  },
  {
    code: "CNL119",
    name: "Soft Ghantia",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Traditional soft savoury snack ideal for platters and tea time.",
    variants: [
      { size: "1kg", price: 216 },
      { size: "250g", price: 54 },
    ],
  },
  {
    code: "CNL120",
    name: "Sweet Sticks",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Sweet crunchy snack sticks perfect for entertaining.",
    variants: [
      { size: "1kg", price: 216 },
      { size: "250g", price: 54 },
    ],
  },
  {
    code: "CNL121",
    name: "Fried Peas",
    category: "Honey, Speciality & Savoury Snacks",
    desc: "Crunchy fried peas with savoury flavour and texture.",
    variants: [
      { size: "1kg", price: 216 },
      { size: "250g", price: 54 },
    ],
  },
  {
    code: "CNL122",
    name: "HealFuel Ready Mix Talbina",
    category: "Health Mixes & Breakfast Range",
    desc: "Healthy ready-mix barley breakfast packed with nutrition.",
    variants: [
      { size: "Pack", price: 81 },
    ],
  },
  {
    code: "CNL123",
    name: "Plain Talbina Barley Porridge",
    category: "Health Mixes & Breakfast Range",
    desc: "Traditional barley porridge mix for healthy breakfasts.",
    variants: [
      { size: "Pack", price: 68 },
    ],
  },
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStock, setActiveStock] = useState("All Stock");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [customer, setCustomer] = useState({
  name: "",
  phone: "",
  email: "",
  orderType: "Collection",
  address: "",
  notes: "",
});
const [productImages, setProductImages] = useState({});
const [productStock, setProductStock] = useState({});
const [productPricing, setProductPricing] = useState({});
const [isAdmin, setIsAdmin] = useState(false);
const [adminView, setAdminView] = useState("products");
const [orders, setOrders] = useState([]);
const [expandedOrderId, setExpandedOrderId] = useState(null);
const [showOrderConfirm, setShowOrderConfirm] = useState(false);
const [paymentMethod, setPaymentMethod] = useState("EFT / Proof of Payment");
const [cartToast, setCartToast] = useState("");
const [showEftConfirm, setShowEftConfirm] = useState(false);
const [pendingWhatsappUrl, setPendingWhatsappUrl] = useState("");
const [showOrderSuccess, setShowOrderSuccess] = useState(false);

const loadProductImages = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/product-images`
    );

    const fixedImages = {};

      Object.entries(response.data || {}).forEach(([code, url]) => {
        fixedImages[code] = url.replace(
          "http://localhost:5000",
            API_BASE_URL
      );
    });
    setProductImages(fixedImages);
    
  } catch (err) {
    console.error("Failed to load product images:", err);
  }
};
const loadProductStock = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/product-stock`
    );

    setProductStock(response.data || {});
  } catch (err) {
    console.error("Failed to load stock:", err);
  }
};

const loadProductPricing = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/product-pricing`);
    setProductPricing(response.data || {});
  } catch (err) {
    console.error("Failed to load pricing:", err);
  }
};

const loadOrders = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/orders`);
    setOrders(response.data || []);
  } catch (err) {
    console.error("Failed to load orders:", err);
  }
};
useEffect(() => {
  loadProductImages();
  loadProductStock();
  loadProductPricing();
  loadOrders();
}, []);
const supplierWholesalePrices = {
  "CNL01-100g": 22.5,
  "CNL01-1kg": 185,
  "CNL01-250g": 51,
  "CNL01-500g": 92.5,
  "CNL01-50g": 13,
  "CNL02-100g": 25,
  "CNL02-1kg": 225,
  "CNL02-250g": 59,
  "CNL02-500g": 112.5,
  "CNL02-50g": 17,
  "CNL03-100g": 25,
  "CNL03-1kg": 225,
  "CNL03-250g": 59,
  "CNL03-500g": 112.5,
  "CNL03-50g": 17,
  "CNL04-100g": 32,
  "CNL04-1kg": 270,
  "CNL04-250g": 72,
  "CNL04-500g": 135,
  "CNL04-50g": 18.5,
  "CNL05-100g": 22,
  "CNL05-1kg": 180,
  "CNL05-250g": 48,
  "CNL05-500g": 90,
  "CNL05-50g": 12.5,
  "CNL06-100g": 33.5,
  "CNL06-1kg": 305,
  "CNL06-250g": 80,
  "CNL06-500g": 152.5,
  "CNL06-50g": 18,
  "CNL07-100g": 18,
  "CNL07-1kg": 153,
  "CNL07-250g": 41,
  "CNL07-500g": 76.5,
  "CNL07-50g": 9,
  "CNL08-100g": 24,
  "CNL08-1kg": 190,
  "CNL08-250g": 52.5,
  "CNL08-500g": 95,
  "CNL08-50g": 12.5,
  "CNL09-100g": 24,
  "CNL09-1kg": 190,
  "CNL09-250g": 52.5,
  "CNL09-500g": 95,
  "CNL09-50g": 12.5,
  "CNL10-100g": 24,
  "CNL10-1kg": 190,
  "CNL10-250g": 52.5,
  "CNL10-500g": 95,
  "CNL10-50g": 12.5,
  "CNL11-100g": 24,
  "CNL11-1kg": 190,
  "CNL11-250g": 52.5,
  "CNL11-500g": 95,
  "CNL11-50g": 12.5,
  "CNL12-100g": 10,
  "CNL12-1kg": 65,
  "CNL12-250g": 20,
  "CNL12-500g": 32.5,
  "CNL12-50g": 6,
  "CNL13-100g": 40,
  "CNL13-1kg": 360,
  "CNL13-250g": 95,
  "CNL13-500g": 180,
  "CNL13-50g": 23,
  "CNL14-100g": 55,
  "CNL14-1kg": 495,
  "CNL14-250g": 124,
  "CNL14-500g": 247.5,
  "CNL14-50g": 32,
  "CNL15-100g": 18,
  "CNL15-1kg": 160,
  "CNL15-250g": 44,
  "CNL15-500g": 80,
  "CNL15-50g": 9,
  "CNL16-100g": 18,
  "CNL16-1kg": 160,
  "CNL16-250g": 44,
  "CNL16-500g": 80,
  "CNL16-50g": 9,
  "CNL17-100g": 19.5,
  "CNL17-1kg": 170,
  "CNL17-250g": 45.5,
  "CNL17-500g": 85,
  "CNL17-50g": 10,
  "CNL18-100g": 22,
  "CNL18-1kg": 180,
  "CNL18-250g": 48,
  "CNL18-500g": 90,
  "CNL18-50g": 12.5,
  "CNL19-100g": 19.5,
  "CNL19-1kg": 170,
  "CNL19-250g": 45.5,
  "CNL19-500g": 85,
  "CNL19-50g": 10,
  "CNL20-100g": 26,
  "CNL20-1kg": 210,
  "CNL20-250g": 58,
  "CNL20-500g": 105,
  "CNL20-50g": 15,
  "CNL21-100g": 26,
  "CNL21-1kg": 210,
  "CNL21-250g": 58,
  "CNL21-500g": 105,
  "CNL21-50g": 15,
  "CNL22-100g": 25,
  "CNL22-1kg": 200,
  "CNL22-250g": 55,
  "CNL22-500g": 100,
  "CNL22-50g": 13.5,
  "CNL23-100g": 25.5,
  "CNL23-1kg": 205,
  "CNL23-250g": 56,
  "CNL23-500g": 102.5,
  "CNL23-50g": 15,
  "CNL24-100g": 10,
  "CNL24-1kg": 72,
  "CNL24-250g": 25,
  "CNL24-500g": 37.5,
  "CNL24-50g": 6.5,
  "CNL25-100g": 10,
  "CNL25-1kg": 72,
  "CNL25-250g": 25,
  "CNL25-500g": 37.5,
  "CNL25-50g": 6.5,
  "CNL26-100g": 9,
  "CNL26-1kg": 60,
  "CNL26-250g": 17.5,
  "CNL26-500g": 32.5,
  "CNL26-50g": 6,
  "CNL27-100g": 10,
  "CNL27-1kg": 72,
  "CNL27-250g": 25,
  "CNL27-500g": 37.5,
  "CNL27-50g": 6.5,
  "CNL28-100g": 22,
  "CNL28-1kg": 180,
  "CNL28-250g": 48,
  "CNL28-500g": 90,
  "CNL28-50g": 12.5,
  "CNL29-100g": 19.5,
  "CNL29-1kg": 170,
  "CNL29-250g": 45.5,
  "CNL29-500g": 85,
  "CNL29-50g": 10,
  "CNL30-100g": 55,
  "CNL30-1kg": 495,
  "CNL30-250g": 124,
  "CNL30-500g": 247.5,
  "CNL30-50g": 32,
  "CNL31-100g": 32,
  "CNL31-1kg": 285,
  "CNL31-250g": 75,
  "CNL31-500g": 142.5,
  "CNL31-50g": 20,
  "CNL32-100g": 100,
  "CNL32-1kg": 950,
  "CNL32-250g": 285,
  "CNL32-500g": 500,
  "CNL32-50g": 55,
  "CNL33-100g": 25,
  "CNL33-1kg": 200,
  "CNL33-250g": 55,
  "CNL33-500g": 100,
  "CNL33-50g": 13.5,
  "CNL34-100g": 23.5,
  "CNL34-1kg": 220,
  "CNL34-250g": 57,
  "CNL34-500g": 110,
  "CNL34-50g": 16,
  "CNL35-100g": 25,
  "CNL35-1kg": 225,
  "CNL35-250g": 59,
  "CNL35-500g": 112.5,
  "CNL35-50g": 17,
  "CNL36-100g": 26,
  "CNL36-1kg": 195,
  "CNL36-250g": 54,
  "CNL36-500g": 97.5,
  "CNL36-50g": 13.5,
  "CNL37-100g": 12,
  "CNL37-1kg": 80,
  "CNL37-250g": 25,
  "CNL37-500g": 40,
  "CNL37-50g": 8,
  "CNL38-100g": 25,
  "CNL38-1kg": 245,
  "CNL38-250g": 62,
  "CNL38-500g": 122.5,
  "CNL38-50g": 15,
  "CNL39-100g": 22,
  "CNL39-1kg": 180,
  "CNL39-250g": 48,
  "CNL39-500g": 90,
  "CNL39-50g": 12.5,
  "CNL40-100g": 28,
  "CNL40-1kg": 255,
  "CNL40-250g": 65,
  "CNL40-500g": 127.5,
  "CNL40-50g": 17,
  "CNL41-100g": 12,
  "CNL41-1kg": 80,
  "CNL41-250g": 25,
  "CNL41-500g": 40,
  "CNL41-50g": 8,
  "CNL42-100g": 25,
  "CNL42-1kg": 225,
  "CNL42-250g": 59,
  "CNL42-500g": 112.5,
  "CNL42-50g": 17,
  "CNL43-100g": 25,
  "CNL43-1kg": 245,
  "CNL43-250g": 62,
  "CNL43-500g": 122.5,
  "CNL43-50g": 15,
  "CNL44-100g": 23.5,
  "CNL44-1kg": 235,
  "CNL44-250g": 60,
  "CNL44-500g": 117.5,
  "CNL44-50g": 12.5,
  "CNL45-100g": 12,
  "CNL45-1kg": 80,
  "CNL45-250g": 25,
  "CNL45-500g": 40,
  "CNL45-50g": 8,
  "CNL46-100g": 23.5,
  "CNL46-1kg": 220,
  "CNL46-250g": 57,
  "CNL46-500g": 110,
  "CNL46-50g": 16,
  "CNL47-100g": 25,
  "CNL47-1kg": 225,
  "CNL47-250g": 59,
  "CNL47-500g": 112.5,
  "CNL47-50g": 17,
  "CNL48-100g": 23.5,
  "CNL48-1kg": 235,
  "CNL48-250g": 60,
  "CNL48-500g": 117.5,
  "CNL48-50g": 12.5,
  "CNL49-100g": 15,
  "CNL49-1kg": 90,
  "CNL49-250g": 28,
  "CNL49-500g": 45,
  "CNL49-50g": 8.5,
  "CNL50-100g": 15,
  "CNL50-1kg": 130,
  "CNL50-250g": 36,
  "CNL50-500g": 65,
  "CNL50-50g": 7.5,
  "CNL51-100g": 26,
  "CNL51-1kg": 195,
  "CNL51-250g": 54,
  "CNL51-500g": 97.5,
  "CNL51-50g": 13.5,
  "CNL52-100g": 26,
  "CNL52-1kg": 195,
  "CNL52-250g": 54,
  "CNL52-500g": 97.5,
  "CNL52-50g": 13.5,
  "CNL53-100g": 26,
  "CNL53-1kg": 195,
  "CNL53-250g": 54,
  "CNL53-500g": 97.5,
  "CNL53-50g": 13.5,
  "CNL54-100g": 37,
  "CNL54-1kg": 320,
  "CNL54-250g": 85,
  "CNL54-500g": 160,
  "CNL54-50g": 21,
  "CNL55-100g": 20,
  "CNL55-1kg": 175,
  "CNL55-250g": 45,
  "CNL55-500g": 87.5,
  "CNL55-50g": 11.5,
  "CNL56-100g": 11.5,
  "CNL56-1kg": 76.5,
  "CNL56-250g": 22.5,
  "CNL56-500g": 40.5,
  "CNL56-50g": 6,
  "CNL57-100g": 19.5,
  "CNL57-1kg": 170,
  "CNL57-250g": 45.5,
  "CNL57-500g": 85,
  "CNL57-50g": 10,
  "CNL58-100g": 40,
  "CNL58-1kg": 330,
  "CNL58-250g": 88,
  "CNL58-500g": 165,
  "CNL58-50g": 21.5,
  "CNL59-100g": 25,
  "CNL59-1kg": 245,
  "CNL59-250g": 62,
  "CNL59-500g": 122.5,
  "CNL59-50g": 15,
  "CNL60-100g": 33.5,
  "CNL60-1kg": 305,
  "CNL60-250g": 80,
  "CNL60-500g": 152.5,
  "CNL60-50g": 18,
  "CNL61-100g": 15,
  "CNL61-1kg": 140,
  "CNL61-250g": 38.5,
  "CNL61-500g": 70,
  "CNL61-50g": 8,
  "CNL62-100g": 18,
  "CNL62-1kg": 155,
  "CNL62-250g": 40,
  "CNL62-500g": 77.5,
  "CNL62-50g": 11,
  "CNL63-100g": 18,
  "CNL63-1kg": 155,
  "CNL63-250g": 40,
  "CNL63-500g": 77.5,
  "CNL63-50g": 11,
  "CNL64-100g": 25,
  "CNL64-1kg": 225,
  "CNL64-250g": 59,
  "CNL64-500g": 112.5,
  "CNL64-50g": 17,
  "CNL65-100g": 24,
  "CNL65-1kg": 205,
  "CNL65-250g": 56,
  "CNL65-500g": 102.5,
  "CNL65-50g": 15,
  "CNL66-100g": 16.5,
  "CNL66-1kg": 125,
  "CNL66-250g": 35,
  "CNL66-500g": 62.5,
  "CNL66-50g": 8.5,
  "CNL67-100g": 43.5,
  "CNL67-1kg": 335,
  "CNL67-250g": 90,
  "CNL67-500g": 167.5,
  "CNL67-50g": 26.5,
  "CNL68-100g": 12.5,
  "CNL68-1kg": 105,
  "CNL68-250g": 30,
  "CNL68-500g": 52.5,
  "CNL68-50g": 6.5,
  "CNL69-12 Pack": 28,
  "CNL69-24 Pack": 58,
  "CNL69-5 Pack": 12.5,
  "CNL70-100g": 16,
  "CNL70-1kg": 135,
  "CNL70-250g": 37,
  "CNL70-500g": 67.5,
  "CNL70-50g": 8.5,
  "CNL71-100g": 12,
  "CNL71-1kg": 95,
  "CNL71-250g": 27,
  "CNL71-500g": 47.5,
  "CNL71-50g": 6.5,
  "CNL72-100g": 12,
  "CNL72-1kg": 95,
  "CNL72-250g": 27,
  "CNL72-500g": 47.5,
  "CNL72-50g": 6.5,
  "CNL73-1kg": 55,
  "CNL73-500g": 27.5,
  "CNL74-100g": 18,
  "CNL74-1kg": 155,
  "CNL74-250g": 40,
  "CNL74-500g": 77.5,
  "CNL74-50g": 11,
  "CNL75-100g": 13,
  "CNL75-1kg": 110,
  "CNL75-250g": 32,
  "CNL75-500g": 55,
  "CNL75-50g": 7,
  "CNL76-100g": 14,
  "CNL76-1kg": 100,
  "CNL76-250g": 28.5,
  "CNL76-500g": 50,
  "CNL76-50g": 7,
  "CNL77-100g": 14,
  "CNL77-1kg": 100,
  "CNL77-250g": 28.5,
  "CNL77-500g": 50,
  "CNL77-50g": 7,
  "CNL78-100g": 13,
  "CNL78-1kg": 110,
  "CNL78-250g": 32,
  "CNL78-500g": 55,
  "CNL78-50g": 7,
  "CNL79-100g": 26,
  "CNL79-1kg": 195,
  "CNL79-250g": 54,
  "CNL79-500g": 97.5,
  "CNL79-50g": 13.5,
  "CNL80-100g": 18,
  "CNL80-1kg": 150,
  "CNL80-250g": 40,
  "CNL80-500g": 75,
  "CNL80-50g": 9,
  "CNL81-100g": 18,
  "CNL81-1kg": 150,
  "CNL81-250g": 40,
  "CNL81-500g": 75,
  "CNL81-50g": 9,
  "CNL82-100g": 18,
  "CNL82-1kg": 150,
  "CNL82-250g": 40,
  "CNL82-500g": 75,
  "CNL82-50g": 9,
  "CNL83-100g": 18,
  "CNL83-1kg": 150,
  "CNL83-250g": 40,
  "CNL83-500g": 75,
  "CNL83-50g": 9,
  "CNL84-100g": 18,
  "CNL84-1kg": 150,
  "CNL84-250g": 40,
  "CNL84-500g": 75,
  "CNL84-50g": 9,
  "CNL85-100g": 18,
  "CNL85-1kg": 150,
  "CNL85-250g": 40,
  "CNL85-500g": 75,
  "CNL85-50g": 9,
  "CNL86-100g": 18,
  "CNL86-1kg": 150,
  "CNL86-250g": 40,
  "CNL86-500g": 75,
  "CNL86-50g": 9,
  "CNL87-100g": 18,
  "CNL87-1kg": 150,
  "CNL87-250g": 40,
  "CNL87-500g": 75,
  "CNL87-50g": 9,
  "CNL88-100g": 18,
  "CNL88-1kg": 150,
  "CNL88-250g": 40,
  "CNL88-500g": 75,
  "CNL88-50g": 9,
  "CNL89-100g": 18,
  "CNL89-1kg": 150,
  "CNL89-250g": 40,
  "CNL89-500g": 75,
  "CNL89-50g": 9,
  "CNL90-100g": 18,
  "CNL90-1kg": 150,
  "CNL90-250g": 40,
  "CNL90-500g": 75,
  "CNL90-50g": 9,
  "CNL91-100g": 20,
  "CNL91-1kg": 165,
  "CNL91-250g": 45,
  "CNL91-500g": 82.5,
  "CNL91-50g": 11,
  "CNL92-100g": 11.5,
  "CNL92-1kg": 76.5,
  "CNL92-250g": 22.5,
  "CNL92-500g": 40.5,
  "CNL92-50g": 6,
  "CNL93-100g": 15,
  "CNL93-1kg": 121,
  "CNL93-250g": 34.5,
  "CNL93-500g": 60.5,
  "CNL93-50g": 7.5,
  "CNL94-100g": 20,
  "CNL94-1kg": 175,
  "CNL94-250g": 45,
  "CNL94-500g": 87.5,
  "CNL94-50g": 11.5,
  "CNL96-100g": 14,
  "CNL96-1kg": 115,
  "CNL96-250g": 32,
  "CNL96-500g": 57.5,
  "CNL96-50g": 7.5,
  "CNL97-100g": 15,
  "CNL97-1kg": 140,
  "CNL97-250g": 38.5,
  "CNL97-500g": 70,
  "CNL97-50g": 8,
  "CNL98-100g": 11.5,
  "CNL98-1kg": 76.5,
  "CNL98-250g": 22.5,
  "CNL98-500g": 40.5,
  "CNL98-50g": 6,
  "CNL99-100g": 15,
  "CNL99-1kg": 121,
  "CNL99-250g": 34.5,
  "CNL99-500g": 60.5,
  "CNL99-50g": 7.5,
  "CNL100-100g": 15,
  "CNL100-1kg": 121,
  "CNL100-250g": 34.5,
  "CNL100-500g": 60.5,
  "CNL100-50g": 7.5,
  "CNL101-100g": 15,
  "CNL101-1kg": 121,
  "CNL101-250g": 34.5,
  "CNL101-500g": 60.5,
  "CNL101-50g": 7.5,
  "CNL102-100g": 26,
  "CNL102-1kg": 195,
  "CNL102-250g": 54,
  "CNL102-500g": 97.5,
  "CNL102-50g": 13.5,
  "CNL103-100g": 15,
  "CNL103-1kg": 121,
  "CNL103-250g": 34.5,
  "CNL103-500g": 60.5,
  "CNL103-50g": 7.5,
  "CNL104-100g": 15,
  "CNL104-1kg": 121,
  "CNL104-250g": 34.5,
  "CNL104-500g": 60.5,
  "CNL104-50g": 7.5,
  "CNL105-100g": 25,
  "CNL105-1kg": 240,
  "CNL105-250g": 62.5,
  "CNL105-500g": 120,
  "CNL105-50g": 13,
  "CNL106-100g": 25,
  "CNL106-1kg": 240,
  "CNL106-250g": 62.5,
  "CNL106-500g": 120,
  "CNL106-50g": 13,
  "CNL107-100g": 25,
  "CNL107-1kg": 240,
  "CNL107-250g": 62.5,
  "CNL107-500g": 120,
  "CNL107-50g": 13,
  "CNL108-100g": 24.5,
  "CNL108-1kg": 212,
  "CNL108-250g": 55,
  "CNL108-500g": 106,
  "CNL108-50g": 14.5,
  "CNL109-100g": 14,
  "CNL109-1kg": 100,
  "CNL109-250g": 28.5,
  "CNL109-500g": 50,
  "CNL109-50g": 7,
  "CNL110-1kg": 66,
  "CNL110-500g": 40,
  "CNL111-500g": 75,
  "CNL112-1.4kg": 200,
  "CNL113-500g": 85,
  "CNL114-450g": 85,
  "CNL115-1kg": 180,
  "CNL115-300g": 58.5,
  "CNL115-500g": 90,
  "CNL116-Pack": 30,
  "CNL117-Pack": 30,
  "CNL118-Pack": 30,
  "CNL119-1kg": 160,
  "CNL119-250g": 40,
  "CNL120-1kg": 160,
  "CNL120-250g": 40,
  "CNL121-1kg": 160,
  "CNL121-250g": 40,
  "CNL122-Pack": 60,
  "CNL123-Pack": 50,
  "CNL124-Pack": 125,
  "CNL125-Pack": 115,
  "CNL126-Pack": 70,
  "CNL127-Pack": 70,
  "CNL128-Pack": 95,
  "CNL129-50g": 20,
  "CNL129-70g": 20,
};

// === PRODUCT OPTIONS BLOCK ===
// Replace your current productOptions useMemo block with this:
 const roundToNearestFive = (value) => {
  return Math.round(value / 5) * 5;
};

const calculateSellingPrice = (wholesalePrice) => {
  return roundToNearestFive(Number(wholesalePrice || 0) * 1.35);
};

const getPricingKey = (code, size) => {
  return `${code}-${size}`;
};
const productOptions = useMemo(() => {
  return catalog.flatMap((product) =>
    product.variants.map((variant) => {
      const pricingKey = getPricingKey(product.code, variant.size);

      const wholesalePrice =
       productPricing[pricingKey] ??
supplierWholesalePrices[pricingKey] ??
Number((variant.price / 1.35).toFixed(2));

      return {
        id: `${product.code}-${variant.size}`,
        code: product.code,
        name: product.name,
        category: product.category,
        desc: product.desc,
        size: variant.size,
        wholesalePrice,
        price: calculateSellingPrice(wholesalePrice),
      };
    })
  );
}, [productPricing]);

  const filteredProducts = useMemo(() => {
  return productOptions.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;

    const stockStatus = productStock[item.code] || "In Stock";

    const matchesStock =
      activeStock === "All Stock" || stockStatus === activeStock;

    const searchText =
      `${item.code} ${item.name} ${item.size} ${item.category}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    return matchesCategory && matchesStock && matchesSearch;
  });
}, [activeCategory, activeStock, productOptions, productStock, search]);

  const addToCart = (product) => {
      const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    setCart(
      cart.map((item) =>
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  } else {
    setCart([...cart, { ...product, qty: 1 }]);
  }

  setCartToast(`${product.name} added to cart`);

  setTimeout(() => {
    setCartToast("");
  }, 1800);
};
const cartItemCount = cart.reduce((total, item) => total + item.qty, 0);
const getItemWeightKg = (item) => {
  const sizeText = String(item.size || "").toLowerCase();

  if (sizeText.includes("kg")) {
    return parseFloat(sizeText.replace("kg", "").trim()) || 0;
  }

  if (sizeText.includes("g")) {
    return (parseFloat(sizeText.replace("g", "").trim()) || 0) / 1000;
  }

  return 0;
};
const cartWeightKg = cart.reduce(
  (total, item) => total + getItemWeightKg(item) * item.qty,
  0
);

const deliveryFee =
  customer.orderType === "Delivery"
    ? DELIVERY_TIERS.find((tier) => cartWeightKg <= tier.maxKg)?.fee || 0
    : 0;
const buildCustomerConfirmationMessage = (order) => {
  return `Hi ${order.customer_name},

Thank you for your order with The Snack Merchant 🙌

We have received your order:

Order Number: ${order.order_number}
Total: R${order.total_amount}
Payment Method: ${order.payment_method || "-"}
${order.payment_method === "Payment Link"
  ? `A secure payment link will be sent to you shortly for the final order amount.

Once payment is completed, we will confirm and prepare your order.`
  : `For EFT payment, please use the details below:

Bank: ${EFT_BANK}
Account Name: ${EFT_ACCOUNT_NAME}
Account Number: ${EFT_ACCOUNT_NUMBER}
Branch Code: ${EFT_BRANCH_CODE}

Reference:
${order.customer_name} ${order.customer_phone}

Please send proof of payment on WhatsApp once completed.`}
Thank you for supporting The Snack Merchant 🌰`;
};
const buildPaymentLinkMessage = (order) => {
  return `Hi ${order.customer_name},

Thank you for your order with The Snack Merchant 🙌

Please complete payment using the secure payment link below:

[PASTE PAYMENT LINK HERE]

Order Number: ${order.order_number}
Amount Due: R${order.total_amount}

Once payment is completed, we will confirm and prepare your order.

Thank you for supporting The Snack Merchant 🌰`;
};
const generateInvoicePDF = (order) => {
  const doc = new jsPDF();

  // ================= HEADER =================
  doc.addImage("/invoice-logo.png", "PNG", 18, 10, 28, 28);

  doc.setFontSize(22);
  doc.setTextColor(212, 175, 55);
  doc.text("THE SNACK MERCHANT", 52, 22);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Artisan Nuts • Dried Fruit • Snacks", 52, 30);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("https://snack-merchant-app.vercel.app/", 52, 38);

  // ================= INVOICE INFO =================
  doc.setFontSize(16);
  doc.text("INVOICE", 150, 20);

  doc.setFontSize(11);
  doc.text(`Invoice #: ${order.order_number}`, 150, 30);
  doc.text(
    `Date: ${new Date(order.created_at).toLocaleString()}`,
    150,
    38
  );

  // ================= CUSTOMER DETAILS =================
  doc.setFontSize(13);
  doc.text("Customer Details", 20, 55);

  doc.setFontSize(11);
  doc.text(`Name: ${order.customer_name}`, 20, 65);
  doc.text(`Phone: ${order.customer_phone}`, 20, 73);
  doc.text(
    `Email: ${order.customer_email || "Not provided"}`,
    20,
    81
  );
  doc.text(`Order Type: ${order.order_type}`, 20, 89);
  doc.text(
    `Payment Method: ${order.payment_method || "-"}`,
    20,
    97
  );
  if (order.order_type === "Delivery") {
  doc.text(
    `Delivery Fee: R${order.delivery_fee || 0}`,
    20,
    105
  );
}

  // ================= ITEMS TABLE =================
  autoTable(doc, {
    startY: order.order_type === "Delivery" ? 118 : 110,
    head: [["Product", "Size", "Qty", "Unit Price", "Line Total"]],
    body: [
  ...order.items.map((item) => [
    item.name,
    item.size,
    item.qty,
    `R${item.price}`,
    `R${item.price * item.qty}`,
  ]),
  ...(order.order_type === "Delivery"
    ? [["PUDO Delivery", "-", 1, `R${order.delivery_fee || 0}`, `R${order.delivery_fee || 0}`]]
    : []),
],
  });

  // ================= TOTAL =================
  const finalY = doc.lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text(`Total: R${order.total_amount}`, 150, finalY);

// ================= PAYMENT INSTRUCTIONS =================
doc.setFontSize(13);

if (order.payment_method === "Payment Link") {
  doc.text("Payment Instructions", 20, finalY + 20);

  doc.setFontSize(11);
  doc.text(
    "A secure payment link will be sent separately via WhatsApp.",
    20,
    finalY + 30
  );
} else {
  doc.text("EFT Banking Details", 20, finalY + 20);

  doc.setFontSize(11);
  doc.text(`Bank: ${EFT_BANK}`, 20, finalY + 30);
  doc.text(`Account Name: ${EFT_ACCOUNT_NAME}`, 20, finalY + 38);
  doc.text(`Account Number: ${EFT_ACCOUNT_NUMBER}`, 20, finalY + 46);
  doc.text(`Branch Code: ${EFT_BRANCH_CODE}`, 20, finalY + 54);
}
  // ================= FOOTER =================
  doc.setFontSize(10);
  doc.text(
    "The Snack Merchant • Quality You Can Taste",
    20,
    finalY + 75
  );

  const blobUrl = doc.output("bloburl");
window.open(blobUrl, "_blank");
};
  const decreaseQty = (id) => {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(item.qty - 1, 0) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const increaseQty = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const productTotal = cart.reduce(
  (sum, item) => sum + item.price * item.qty,
  0
);

const total = productTotal + deliveryFee;

  const uploadProductImage = async (productCode, file) => {
  try {
    const formData = new FormData();

    formData.append("image", file);
    formData.append("productCode", productCode);

    const response = await axios.post(
      "http://localhost:5000/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const imageUrl = response.data.imageUrl;

    setProductImages((prev) => ({
      ...prev,
      [productCode]: imageUrl,
    }));

  } catch (err) {
    console.error(err);

    alert("Image upload failed");
  }
};

  const sendWhatsAppOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!customer.name.trim() || !customer.phone.trim()) {
      alert("Please enter your name and phone number before placing the order.");
      return;
    }

    if (customer.orderType === "Delivery" && !customer.address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    let message =
      "Hello Gideon, I would like to place an order from The Snack Merchant:\n\n";

    message += "CUSTOMER DETAILS:\n";
    message += `Name: ${customer.name}\n`;
    message += `Phone: ${customer.phone}\n`;
    message += `Email: ${customer.email || "Not provided"}\n`;
    message += `Order Type: ${customer.orderType}\n`;
    message += `Payment Method: ${paymentMethod}\n`;
    if (paymentMethod === "Payment Link") {
  message += `Payment Link Requested: Yes\n`;
}
    if (customer.orderType === "Delivery") {
  message += `Delivery Fee: R${deliveryFee}\n`;
}

    if (customer.orderType === "Delivery") {
      message += `Address: ${customer.address}\n`;
    }

    if (customer.notes.trim()) {
      message += `Notes: ${customer.notes}\n`;
    }

    message += "\nORDER:\n";

    cart.forEach((item) => {
      const stockStatus = productStock[item.code] || "In Stock";

      message += `• ${item.code} - ${item.name} (${item.size}) x ${
        item.qty
      } = R${item.price * item.qty}`;

      if (stockStatus !== "In Stock") {
         message += ` [${stockStatus}]`;
      }

      message += "\n";
    });

   if (paymentMethod === "EFT / Proof of Payment") {
 message += `

━━━━━━━━━━━━━━━
ORDER TOTAL: R${total}
━━━━━━━━━━━━━━━

Payment Method: ${paymentMethod}
Reference: ${customer.name} ${customer.phone}
`;
}

    const encodedMessage = encodeURIComponent(message);

    try {
     await fetch("https://snack-merchant-app.onrender.com/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      orderType: customer.orderType,
      paymentMethod: paymentMethod,
      deliveryAddress: customer.address,
      customerNotes: customer.notes,
      items: cart,
      totalAmount: total,
      deliveryFee: deliveryFee,
    }),
  });

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

if (paymentMethod === "EFT / Proof of Payment") {
  setPendingWhatsappUrl(whatsappUrl);
  setShowEftConfirm(true);
} else {
  window.open(whatsappUrl, "_blank");
setCart([]);
setShowOrderSuccess(true);
}
} catch (error) {
  console.error(error);
  alert("Failed to save order.");
}
;}
const payWithPayFast = async () => {
  try {
        const response = await fetch(
      `${API_BASE_URL}/create-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          customerName: customer.name,
          customerEmail: customer.email || "gideonfick@gmail.com",
        }),
      }
    );

    const data = await response.json();

    if (!data.paymentUrl) {
      alert("Could not create payment link.");
      return;
    }

    window.location.href = data.paymentUrl;
  } catch (error) {
    console.error("PayFast error:", error);
    alert("Payment could not be started.");
  }
};
 return (
  <div className="app">

    {cartToast && (
      <div className="cart-toast">
        {cartToast}
      </div>
    )}
    {showEftConfirm && (
  <div className="eft-confirm-overlay">
    <div className="eft-confirm-card">
      <h2>Thank you for your order 🙌</h2>

{paymentMethod === "Payment Link" ? (
  <p>
    Your order is ready to submit. A secure payment link will be sent to you on WhatsApp after your order is received.
  </p>
) : (
  <p>
    Your order is ready to submit. Please review the EFT details below before sending your order via WhatsApp.
  </p>
)}

      {paymentMethod === "EFT / Proof of Payment" && (
  <>
    <div className="eft-highlight">
      <strong>Please complete EFT payment using the details below.</strong>
    </div>

    <div className="eft-details">
      <p><span>Bank</span><strong>{EFT_BANK}</strong></p>
      <p><span>Account Name</span><strong>{EFT_ACCOUNT_NAME}</strong></p>
      <p><span>Account Number</span><strong>{EFT_ACCOUNT_NUMBER}</strong></p>
      <p><span>Branch Code</span><strong>{EFT_BRANCH_CODE}</strong></p>
      <p><span>Reference</span><strong>{customer.name} {customer.phone}</strong></p>
    </div>
  </>
)}

{paymentMethod === "Payment Link" && (
  <div className="eft-highlight">
    <strong>
      A secure payment link will be sent to your WhatsApp number shortly after we receive your order.
    </strong>
  </div>
)}

    <p className="eft-note">
  {paymentMethod === "Payment Link"
    ? "Please submit your order on WhatsApp. We will reply with a secure payment link for the final amount."
    : "Please send your proof of payment on WhatsApp so we can confirm and prepare your order."}
</p>

      <button
  className="eft-confirm-btn"
  onClick={() => {
    setShowEftConfirm(false);
    window.open(pendingWhatsappUrl, "_blank");
setCart([]);
setShowOrderSuccess(true);
  }}
  
>
  Submit Order via WhatsApp
</button>
    </div>
  </div>
)}
{showOrderSuccess && (
  <div className="order-success-overlay">
    <div className="order-success-card">
      <h2>Order Submitted Successfully ✅</h2>

      <p>
        Thank you for your order with The Snack Merchant.
      </p>

      <p>
        Your WhatsApp order message has been prepared successfully.
      </p>

      <p className="order-success-note">
  {paymentMethod === "Payment Link"
    ? "A secure payment link will be sent to you on WhatsApp shortly after we receive your order."
    : "For EFT orders, please send proof of payment on WhatsApp after payment is completed."}
</p>

      <button
        className="order-success-btn"
        onClick={() => setShowOrderSuccess(false)}
      >
        Close
      </button>
    </div>
  </div>
)}
<div className="floating-cart">
<span className="cart-icon">🛒</span>
  {cartItemCount > 0 && (
    <span className="cart-badge">
      {cartItemCount}
    </span>
  )}
</div>
 <div
  style={{
    position: "fixed",
    top: "15px",
    left: "15px",
    zIndex: 9999,
  }}
>
  <button
    onClick={() => {
      const pin = prompt("Enter Admin PIN");

      if (pin === "7106") {
        setIsAdmin(true);
        alert("Admin mode enabled");
      } else {
        alert("Incorrect PIN");
      }
    }}
    style={{
      background: "#111",
      color: "#d4af37",
      border: "1px solid #d4af37",
      padding: "8px 16px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Admin
  </button>
</div>
      <header className="hero">
        <img
           src="/snack-logo.png"
           alt="The Snack Merchant Logo"
           className="logo"
        />

        <h1>THE SNACK MERCHANT</h1>
        <p className="tagline">Artisan Nuts • Dried Fruit • Gourmet Treats</p>
        <p className="subtagline">Quality you can taste</p>

        <div className="hero-buttons">
          <a href="#products">Browse Products</a>
          <a href="#cart" className="secondary">
            View Cart
          </a>
        </div>
      </header>

      <section className="intro">
        <h2>Premium Snacks Delivered</h2>
        <p>
          Browse our full catalog, choose your preferred size and quantity, then
          send your order directly via WhatsApp.
        </p>
      </section>

      <section id="search" className="search-box">
        <input
          type="text"
          placeholder="Search by product, CNL code, size or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <section className="filters">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={activeCategory === cat ? "active" : ""}
          >
            {cat}
          </button>
        ))}
      </section>
        <section className="stock-filters">
  {["All Stock", "In Stock", "Low Stock", "Available on Order", "Seasonal"].map(
    (status) => (
      <button
        key={status}
        onClick={() => setActiveStock(status)}
        className={activeStock === status ? "active" : ""}
      >
        {status}
      </button>
    )
  )}
</section>
      {isAdmin && (
  <div className="admin-nav-tabs">
    <button
      className={adminView === "products" ? "active-admin-tab" : ""}
      onClick={() => setAdminView("products")}
    >
      Product Admin
    </button>

    <button
      className={adminView === "orders" ? "active-admin-tab" : ""}
      onClick={() => setAdminView("orders")}
    >
      Orders Dashboard
    </button>
  </div>
)}

{adminView === "products" && (
  <p className="product-count">
    Showing {filteredProducts.length} product options
  </p>
)}
   {isAdmin && adminView === "orders" && (
  <section className="orders-admin-panel" id="orders-dashboard">
    <div className="orders-dashboard-header">
  <h2>Admin Orders Dashboard</h2>

  <button onClick={loadOrders}>
    Refresh Orders
  </button>
</div>
<div className="admin-metrics-grid">
  <div className="admin-metric-card">
    <span>Total Orders</span>
    <strong>{orders.length}</strong>
  </div>

  <div className="admin-metric-card">
    <span>Total Sales</span>
    <strong>
      R{orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)}
    </strong>
  </div>

  <div className="admin-metric-card">
    <span>EFT Orders</span>
    <strong>
      {orders.filter((order) => order.payment_method !== "Payment Link").length}
    </strong>
  </div>

  <div className="admin-metric-card">
    <span>Payment Link Orders</span>
    <strong>
      {orders.filter((order) => order.payment_method === "Payment Link").length}
    </strong>
  </div>
</div>
<div className="top-products-card">
  <h3>Top Selling Products</h3>

  {Object.entries(
    orders.reduce((acc, order) => {
      (order.items || []).forEach((item) => {
        const key = `${item.name} (${item.size})`;
        acc[key] = (acc[key] || 0) + Number(item.qty || 0);
      });
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product, qty]) => (
      <div className="top-product-row" key={product}>
        <span>{product}</span>
        <strong>{qty} sold</strong>
      </div>
    ))}
</div>
<div className="top-products-card">
  <h3>Low Stock Alerts</h3>

  {filteredProducts
    .filter((product) => product.stock_status === "Low Stock")
    .slice(0, 8)
    .map((product) => (
      <div className="top-product-row" key={product.id}>
        <span>
          {product.code} — {product.name}
        </span>

        <strong style={{ color: "#ff4d4f" }}>
          Low Stock
        </strong>
      </div>
    ))}

  {filteredProducts.filter(
    (product) => product.stock_status === "Low Stock"
  ).length === 0 && (
    <p style={{ color: "#999" }}>
      No low stock products currently
    </p>
  )}
</div>
    {orders.length === 0 ? (
      <p className="no-orders">No orders yet</p>
    ) : (
      <div className="admin-order-cards">
  {orders.map((order) => (
    <div key={order.id} className="admin-order-card">
      <div className="admin-order-card-header">
        <div>
          <h3>{order.order_number}</h3>
          <p>{new Date(order.created_at).toLocaleString()}</p>
        </div>

        <strong>R{order.total_amount}</strong>
      </div>

      <div className="admin-order-grid">
        <p><span>Customer</span>{order.customer_name}</p>
        <p><span>Phone</span>{order.customer_phone}</p>
        <p><span>Email</span>{order.customer_email || "Not provided"}</p>
        <p><span>Type</span>{order.order_type}</p>
        <p><span>Method</span>{order.payment_method || "-"}</p>
        <p><span>Delivery Fee</span>R{order.delivery_fee || 0}</p>
      </div>

      <div className="admin-order-actions">
        <select
          className={`status-select payment-${(order.payment_status || "Unpaid").toLowerCase()}`}
          value={order.payment_status || "Unpaid"}
          onChange={async (e) => {
            const newPaymentStatus = e.target.value;

            await axios.patch(
              `${API_BASE_URL}/orders/${order.id}/status`,
              { paymentStatus: newPaymentStatus }
            );

            loadOrders();
          }}
        >
          <option>Unpaid</option>
          <option>Paid</option>
        </select>

        <select
          className={`status-select order-${(order.order_status || "New").toLowerCase()}`}
          value={order.order_status || "New"}
          onChange={async (e) => {
            const newOrderStatus = e.target.value;

            await axios.patch(
              `${API_BASE_URL}/orders/${order.id}/status`,
              { orderStatus: newOrderStatus }
            );

            loadOrders();
          }}
        >
          <option>New</option>
          <option>Preparing</option>
          <option>Ready</option>
          <option>Collected</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>

        <button
          className="view-items-btn"
          onClick={() =>
            setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
          }
        >
          {expandedOrderId === order.id ? "Hide Items" : "View Items"}
        </button>
        <button
  className="copy-confirmation-btn"
  onClick={() => {
    navigator.clipboard.writeText(buildCustomerConfirmationMessage(order));
    alert("Customer confirmation message copied.");
  }}
>
  Copy Confirmation
</button>

<button
  className="copy-confirmation-btn"
  onClick={() => generateInvoicePDF(order)}
>
  Download Invoice
</button>
{order.payment_method === "Payment Link" && (
  <button
    className="copy-confirmation-btn"
    onClick={() => {
      navigator.clipboard.writeText(buildPaymentLinkMessage(order));
      alert("Payment link message copied.");
    }}
  >
    Copy Payment Link Message
  </button>
)}
</div>

      {expandedOrderId === order.id && (
        <div className="admin-order-items">
          <h4>Ordered Items</h4>

          {order.items?.map((item, index) => (
            <div key={index} className="admin-order-item">
              <span>{item.code}</span>
              <strong>{item.name}</strong>
              <span>{item.size}</span>
              <span>x {item.qty}</span>
              <span>R{item.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  ))}
</div>
    )}
  </section>
)}
      <main id="products" className="products">
        {filteredProducts.map((product) => (
          <div className="card" key={product.id}>
            <div className="product-image-box">
  {productImages[product.code] ? (
    <img
      src={productImages[product.code]}
       alt={product.name}
       className="product-image"
        onClick={() =>
           setSelectedImage({
            src: productImages[product.code],
            alt: product.name,
    })
  }
/>
  ) : (
    <div className="image-placeholder">
      No photo yet
    </div>
  )}
{isAdmin && (
  <div className="stock-admin">
    <label className="upload-label">
      Add Photo
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];

          if (file) {
            uploadProductImage(product.code, file);
          }
        }}
      />
    </label>

    <label>Stock Status</label>

    <select
      value={productStock[product.code] || "In Stock"}
      onChange={async (e) => {
        const newStatus = e.target.value;

        setProductStock({
          ...productStock,
          [product.code]: newStatus,
        });

        try {
          await axios.post(`${API_BASE_URL}/product-stock`, {
            productCode: product.code,
              stockStatus: newStatus,
          });
        } catch (err) {
          console.error("Failed to save stock:", err);
        }
      }}
    >
      <option>In Stock</option>
      <option>Low Stock</option>
      <option>Available on Order</option>
      <option>Seasonal</option>
    </select>
    <label className="admin-price-label">
  Wholesale Price
</label>

<input
  className="admin-price-input"
  type="number"
  step="0.01"
  value={product.wholesalePrice?.toFixed(2) || ""}
  onChange={(e) => {
    const key = getPricingKey(product.code, product.size);

    setProductPricing({
      ...productPricing,
      [key]: Number(e.target.value),
    });
    axios.post(`${API_BASE_URL}/product-pricing`, {
  key,
  wholesalePrice: Number(e.target.value),
});
  }}
/>

<p className="admin-calculated-price">
  Selling Price: R{calculateSellingPrice(product.wholesalePrice)}
</p>
  </div>
)}
</div>
            <div className="badge">{product.code}</div>

<div
  className={`stock-badge ${
    (productStock[product.code] || "In Stock")
      .toLowerCase()
      .replaceAll(" ", "_")
  }`}
>
  {productStock[product.code] || "In Stock"}
</div>

<h3>{product.name}</h3>

                <p className="size product-size-top">{product.size}</p>
                <p className="category">{product.category}</p>
                <p className="description">{product.desc}</p>
                        <div className="product-footer">
              <div>
                <p className="price">
  R{calculateSellingPrice(
    productPricing[getPricingKey(product.code, product.size)] ??
      supplierWholesalePrices[getPricingKey(product.code, product.size)] ??
      product.wholesalePrice
  )}
</p>
              </div>

              <button onClick={() => addToCart(product)}>Add</button>
            </div>
          </div>
        ))}
      </main>

      

      <section id="cart" className="cart">
        <h2>Your Cart</h2>

        {cart.length === 0 ? (
          <p className="empty">Your cart is empty.</p>
        ) : (
          <>
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <div>
                  <strong>
                    {item.code} — {item.name}
                  </strong>
                  <p>
                    {item.size} • R{item.price} each
                  </p>
                </div>

                <div className="cart-actions">
                  <span>R{item.price * item.qty}</span>

                  <div className="qty-controls">
                    <button onClick={() => decreaseQty(item.id)}>-</button>
                    <strong>{item.qty}</strong>
                    <button onClick={() => increaseQty(item.id)}>+</button>
                  </div>

                  <button onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {customer.orderType === "Delivery" && (
  <div className="delivery-preview-box">
    {customer.orderType === "Delivery" && (
  <div className="delivery-preview-box">
    <strong>PUDO Delivery</strong>
    <p>Total order weight: {cartWeightKg.toFixed(2)} kg</p>
    <p>Delivery fee for this order: R{deliveryFee}</p>
  </div>
)}

    <div className="delivery-preview-rates">
      <span>0–5kg: R69</span>
      <span>5–10kg: R119</span>
      <span>10–15kg: R179</span>
      <span>15–20kg: R249</span>
    </div>
  </div>
)}
            <div className="cart-total">
              <strong>Total</strong>
              <strong>R{total}</strong>
            </div>

            <button
             className="whatsapp"
             onClick={() => setShowOrderConfirm(true)}
>
            <p className="checkout-reminder">
  Please complete your name, phone number, order type and payment method below before reviewing your order.
</p>
             Review Order Before Sending
          </button>
          </>
        )}
      </section>
      
      <nav className="mobile-nav">
  <a href="#products">Products</a>
  <a href="#search">Search</a>
  <a href="#cart">Cart</a>
  <a href="#checkout">Checkout</a>

  <button
    onClick={() =>
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  >
    Top
  </button>
</nav>

<section id="checkout" className="checkout">
        <h2>Checkout Details</h2>

        <div className="checkout-grid">
          <input
            type="text"
            placeholder="Your name"
            value={customer.name}
            onChange={(e) =>
              setCustomer({ ...customer, name: e.target.value })
            }
          />

          <input
            type="tel"
            placeholder="Your phone number"
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
          />
          <input
            type="email"
             placeholder="Your email address (optional)"
             value={customer.email}
              onChange={(e) =>
               setCustomer({ ...customer, email: e.target.value })
            }
          />
          <select
            value={customer.orderType}
            onChange={(e) =>
              setCustomer({ ...customer, orderType: e.target.value })
            }
          >
            <option value="Collection">Collection</option>
            <option value="Delivery">Delivery</option>
          </select>
          <select
  value={paymentMethod}
  onChange={(e) => setPaymentMethod(e.target.value)}
>
<option value="Pay Online" disabled>
  Pay Online - Temporarily unavailable
</option>
<option value="Payment Link">
  Payment Link
</option>
  <option value="EFT / Proof of Payment">
    EFT / Proof of Payment
  </option>
  <option value="Pay on Collection">
    Pay on Collection
  </option>
</select>
          {customer.orderType === "Delivery" && (
            <input
              type="text"
              placeholder="Delivery address"
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
            />
          )}

          <textarea
            placeholder="Order notes / special instructions"
            value={customer.notes}
            onChange={(e) =>
              setCustomer({ ...customer, notes: e.target.value })
            }
          />
        </div>
      </section>

<div className="eft-static-box">
  <h3>EFT Banking Details</h3>
  <p><strong>Bank:</strong> {EFT_BANK}</p>
  <p><strong>Account Name:</strong> {EFT_ACCOUNT_NAME}</p>
  <p><strong>Account Number:</strong> {EFT_ACCOUNT_NUMBER}</p>
  <p><strong>Branch Code:</strong> {EFT_BRANCH_CODE}</p>
  <p><strong>Reference:</strong> Your name + cellphone number</p>
  <p className="eft-static-note">
    Please send proof of payment via WhatsApp after payment.
  </p>
</div>
<div className="app-link-box">
  
  <img
  src="/qr-code_snack_merchant.png"
  alt="Scan to open The Snack Merchant app"
  className="footer-qr-code"
/>
  <p>Open Store Directly:</p>

  <a
    href="https://snack-merchant-app.vercel.app/"
    target="_blank"
    rel="noopener noreferrer"
  >
    snack-merchant-app.vercel.app
  </a>
</div>

<footer>
  <p>The Snack Merchant</p>
  <p>Gideon Fick • 068 759 7884</p>
</footer>

{showOrderConfirm && (
  <div
    className="order-confirm-modal"
    onClick={() => setShowOrderConfirm(false)}
  >
    <div
      className="order-confirm-content"
      onClick={(e) => e.stopPropagation()}
    >
      <h2>Confirm Your Order</h2>

      <div className="confirm-customer-details">
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>Phone:</strong> {customer.phone}</p>
        <p><strong>Order Type:</strong> {customer.orderType}</p>
        <p><strong>Payment Method:</strong> {paymentMethod}</p>

        {customer.orderType === "Delivery" && (
          <p><strong>Address:</strong> {customer.address}</p>
        )}

        {customer.notes && (
          <p><strong>Notes:</strong> {customer.notes}</p>
        )}
      </div>

      <div className="confirm-order-items">
        {cart.map((item, index) => (
          <div key={index} className="confirm-order-row">
            <span>
              {item.name} ({item.size})
            </span>

            <span>
              x {item.qty}
            </span>

            <span>
              R{item.price * item.qty}
            </span>
          </div>
        ))}
      </div>

       {customer.orderType === "Delivery" && (
  <div className="delivery-info-box">
    <h4>PUDO Delivery Fees</h4>
    <p>Delivery is calculated automatically based on total order weight.</p>
    <ul>
      <li>Up to 5kg: R69</li>
      <li>5kg – 10kg: R119</li>
      <li>10kg – 15kg: R179</li>
      <li>15kg – 20kg: R249</li>
    </ul>
  </div>
)} 

      <div className="cart-summary">
  <p>Products Total: R{productTotal}</p>

  {customer.orderType === "Delivery" && (
    <>
      <p>Delivery Weight: {cartWeightKg.toFixed(2)} kg</p>
      <p>Delivery Fee: R{deliveryFee}</p>
    </>
  )}

  <h3>Total: R{total}</h3>
</div>

      <div className="confirm-buttons">
        <button
          className="cancel-confirm-btn"
          onClick={() => setShowOrderConfirm(false)}
        >
          Edit Order
        </button>

        {paymentMethod !== "Pay Online" && (
  <button
    className="confirm-send-btn"
    onClick={() => {
      setShowOrderConfirm(false);
      sendWhatsAppOrder();
    }}
  >
    Confirm & Send
  </button>
)}

{paymentMethod === "Pay Online" && (
  <button
    className="confirm-payfast-btn"
    onClick={() => {
      setShowOrderConfirm(false);
      payWithPayFast();
    }}
  >
    Pay Online with PayFast
  </button>
)}
      </div>
    </div>
  </div>
)}

      {selectedImage && (
  <div className="image-modal" onClick={() => setSelectedImage(null)}>
    <div className="image-modal-content">
      <button
        className="image-modal-close"
        onClick={() => setSelectedImage(null)}
      >
        ×
      </button>

      <img src={selectedImage.src} alt={selectedImage.alt} />
      <p>{selectedImage.alt}</p>
    </div>
  </div>
)}
    </div>
  );
}
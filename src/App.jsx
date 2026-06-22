import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


const WHATSAPP_NUMBER = "27687597884";
const EFT_BANK = "Capitec";
const EFT_ACCOUNT_NAME = "The Snack Merchant";
const EFT_ACCOUNT_NUMBER = "2546259586";
const EFT_BRANCH_CODE = "470010";
const EFT_SWIFT = "N/A";
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

const CUSTOMER_CATEGORIES = [
  "All",
  "Peanuts",
  "Cashews",
  "Almonds",
  "Macadamias",
  "Pistachios",
  "Pecans",
  "Walnuts",
  "Hazelnuts",
  "Brazil Nuts",
  "Mixed Nuts",
  "Dried Fruit",
  "Diced Fruit",
  "Seeds",
  "Honey",
  "Health Pantry",
  "Savoury Snacks",
];
function getCustomerCategory(product) {
  const name = `${product.name || ""} ${product.product_name || ""}`.toLowerCase();

  if (name.includes("peanut")) return "Peanuts";
  if (name.includes("cashew")) return "Cashews";
  if (name.includes("almond")) return "Almonds";
  if (name.includes("macadamia")) return "Macadamias";
  if (name.includes("pistachio")) return "Pistachios";
  if (name.includes("pecan")) return "Pecans";
  if (name.includes("walnut")) return "Walnuts";
  if (name.includes("hazelnut")) return "Hazelnuts";
  if (name.includes("brazil")) return "Brazil Nuts";

  if (
    name.includes("mixed nut") ||
    name.includes("nut mix") ||
    name.includes("nutty remix") ||
    name.includes("trail mix")
  ) return "Mixed Nuts";

  if (
    name.includes("diced") ||
    name.includes("fruit cubes") ||
    name.includes("sugar cubes")
  ) return "Diced Fruit";

  if (
    name.includes("mango") ||
    name.includes("apple") ||
    name.includes("apricot") ||
    name.includes("banana") ||
    name.includes("coconut") ||
    name.includes("cranberr") ||
    name.includes("date") ||
    name.includes("fig") ||
    name.includes("goji") ||
    name.includes("guava") ||
    name.includes("mango") ||
    name.includes("papaya") ||
    name.includes("peach") ||
    name.includes("pineapple") ||
    name.includes("prune") ||
    name.includes("raisin") ||
    name.includes("sultana") ||
    name.includes("fruit")
  ) return "Dried Fruit";

  if (name.includes("seed")) return "Seeds";
  if (name.includes("honey")) return "Honey";

  if (
    name.includes("oats") ||
    name.includes("porridge") ||
    name.includes("talbina") ||
    name.includes("health") ||
    name.includes("breakfast")
  ) return "Health Pantry";

  if (
    name.includes("sev") ||
    name.includes("murku") ||
    name.includes("chevro") ||
    name.includes("ghantia") ||
    name.includes("fried peas") ||
    name.includes("sweet sticks")
  ) return "Savoury Snacks";

  return "Mixed Nuts";
}
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
  const [showShop, setShowShop] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeStock, setActiveStock] = useState("All Stock");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCategoryPage, setSelectedCategoryPage] = useState(null);

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
const [orderDashboardFilter, setOrderDashboardFilter] = useState("all");
const [orders, setOrders] = useState([]);
const [expandedOrderId, setExpandedOrderId] = useState(null);
const [showOrderConfirm, setShowOrderConfirm] = useState(false);
const [paymentMethod, setPaymentMethod] = useState("EFT / Proof of Payment");
const [cartToast, setCartToast] = useState("");
const [showEftConfirm, setShowEftConfirm] = useState(false);
const [showOrderSuccess, setShowOrderSuccess] = useState(false);
const [orderSuccessNumber, setOrderSuccessNumber] = useState("");
const [orderSuccessType, setOrderSuccessType] = useState("order");

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
const getDashboardOrders = () => {
  return orders.filter((order) => {
    const status = normalizeOrderStatus(order.order_status);

    if (orderDashboardFilter === "all") {
      return status !== "Cancelled";
    }

    if (orderDashboardFilter === "pending") {
      return ["New Order", "Pending Stock Confirmation", "Awaiting Payment"].includes(status);
    }

    if (orderDashboardFilter === "paid") {
      return status === "Paid";
    }

    if (orderDashboardFilter === "collection") {
      return order.order_type === "Collection" && status !== "Cancelled";
    }

    if (orderDashboardFilter === "pudo") {
      return order.order_type === "Delivery" && status !== "Cancelled";
    }

    if (orderDashboardFilter === "cancelled") {
      return status === "Cancelled";
    }

    return status !== "Cancelled";
  });
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

useEffect(() => {
  if (window.location.pathname === "/payment-success") {
    localStorage.removeItem("pendingPayfastOrderId");
    setOrderSuccessType("payfast");
    setShowOrderSuccess(true);
    window.history.replaceState({}, "", "/");
  }

  if (window.location.pathname === "/payment-cancelled") {
  const pendingOrderId = localStorage.getItem("pendingPayfastOrderId");

  if (pendingOrderId) {
    fetch(`${API_BASE_URL}/orders/${pendingOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentStatus: "Cancelled",
        orderStatus: "Cancelled",
      }),
    })
      .then(() => {
        localStorage.removeItem("pendingPayfastOrderId");
        loadOrders();
      })
      .catch((error) => {
        console.error("Failed to mark PayFast order as cancelled:", error);
      });
  }

  alert("Payment was not completed. No payment was received. Please place your order again or choose EFT.");
  window.history.replaceState({}, "", "/");
}
  }
, []);

const generatePayFastLinkForOrder = async (order) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/orders/${order.id}/create-payment-link`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!data.success || !data.paymentUrl) {
      alert("Could not generate PayFast payment link.");
      return;
    }

    const message = `Hi ${order.customer_name}

Your order has been approved and is awaiting payment.

Order Number: ${data.orderNumber}

Total Amount Payable: R${Number(data.totalAmount).toFixed(2)}

Please complete secure online payment using the link below:

${data.paymentUrl}

Once payment is received we will prepare your order.

The Snack Merchant 🌰`;

    await navigator.clipboard.writeText(message);

    alert("PayFast payment message copied.");
  } catch (error) {
    console.error("Generate PayFast link error:", error);
    alert("Failed to generate PayFast payment link.");
  }
};
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
 const roundUpToNearestFive = (value) => {
  return Math.ceil(value / 5) * 5;
};

const calculateSellingPrice = (wholesalePrice) => {
  const wholesale = Number(wholesalePrice || 0);

  // Ensures MINIMUM 35% margin
  // Formula: selling = wholesale / 0.65
  const rawSellingPrice = wholesale / 0.65;

  return roundUpToNearestFive(rawSellingPrice);
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
        Number(variant.price || 0);

      const stockStatus =
        productStock[pricingKey] ??
        productStock[product.code] ??
        "In Stock";

      return {
        id: `${product.code}-${variant.size}`,
        code: product.code,
        name: product.name,
        category: product.category,
        desc: product.desc,
        size: variant.size,
        wholesalePrice,
        price: calculateSellingPrice(wholesalePrice),
        stockStatus,
      };
    })
  );
}, [productPricing, productStock]);

  const filteredProducts = useMemo(() => {
  return productOptions.filter((item) => {
   const customerCategory = getCustomerCategory(item);

const matchesCategory =
  activeCategory === "All" || customerCategory === activeCategory;

    const stockStatus = item.stockStatus || productStock[item.code] || "In Stock";

    const matchesStock =
      activeStock === "All Stock" || stockStatus === activeStock;

    const searchText =
      `${item.code} ${item.name} ${item.size} ${item.category} ${getCustomerCategory(item)}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    return matchesCategory && matchesStock && matchesSearch;
  });
}, [activeCategory, activeStock, productOptions, productStock, search]);

const groupedProducts = useMemo(() => {
  const groups = {};

  filteredProducts.forEach((item) => {
    const key = item.code;

    if (!groups[key]) {
      groups[key] = {
        code: item.code,
        name: item.name,
        category: item.category,
        desc: item.desc,
        image: productImages[item.code],
        variants: [],
      };
    }

    groups[key].variants.push(item);
  });

  return Object.values(groups);
}, [filteredProducts, productImages]);
const cancelCurrentOrder = () => {
  setCart([]);

  setCustomer({
    name: "",
    phone: "",
    email: "",
    orderType: "Collection",
    address: "",
    notes: "",
  });

  setPaymentMethod("EFT / Proof of Payment");
  setShowOrderConfirm(false);
  setShowEftConfirm(false);
  setPendingWhatsappUrl("");
  setShowOrderSuccess(false);
  setCartToast("Order cancelled. Your cart has been cleared.");

  setTimeout(() => {
    setCartToast("");
  }, 2500);

  window.location.hash = "#products";
};
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

const normalizeOrderStatus = (status) => {
  if (!status || status === "New") return "New Order";
  if (status === "Preparing") return "Paid";
  if (status === "Ready") return "Ready for Collection";
  if (status === "Dispatched") return "Dispatched";
  if (status === "Collected") return "Closed";
  if (status === "Delivered") return "Closed";
  if (status === "Pending Stock Confirmation")
    return "Pending Stock Confirmation";
  if (status === "Collection Approved") return "Collection Approved";
  if (status === "Converted to PUDO Delivery")
    return "Converted to PUDO Delivery";
  if (status === "Awaiting Payment") return "Awaiting Payment";
  return status;
};

const buildCustomerConfirmationMessage = (order) => {
  const orderStatus = normalizeOrderStatus(order.order_status);
  const isDelivery = order.order_type === "Delivery";
  const isCollection = order.order_type === "Collection";
  const paymentMethodLabel = order.payment_method || "-";

  const orderTotal = Number(order.total_amount || 0);
  const savedDeliveryFee = Number(order.delivery_fee || 0);

  // If a Collection order is converted to PUDO but no delivery fee has been saved yet,
  // show the minimum PUDO fee so the customer understands the revised payable amount.
  const convertedPudoFee =
    savedDeliveryFee > 0 ? savedDeliveryFee : DELIVERY_TIERS[0]?.fee || 69;

  const convertedPudoTotal =
    orderStatus === "Converted to PUDO Delivery" && isCollection
      ? orderTotal + convertedPudoFee
      : orderTotal;

  const orderTypeLabel = isCollection
    ? "Centurion Collection Request"
    : "PUDO Locker Delivery";

  const formatMoney = (value) => Number(value || 0).toFixed(2);

  const orderSummary = `Order Number: ${order.order_number}
Order Total: R${formatMoney(orderTotal)}
Order Type: ${orderTypeLabel}
`;

  const deliveryDetails = isDelivery
    ? `

Delivery Method: ${DELIVERY_METHOD}
Delivery Fee: R${formatMoney(savedDeliveryFee)}
Delivery Address: ${order.delivery_address || "Not provided"}`
    : "";

  const eftDetails = `Bank: ${EFT_BANK}
  Account Name: ${EFT_ACCOUNT_NAME}
  Account Number: ${EFT_ACCOUNT_NUMBER}
  Branch Code: ${EFT_BRANCH_CODE}
  Reference / Payment Reference: ${order.order_number}`;

  let message = `Hi ${order.customer_name},

`;

  if (orderStatus === "New Order") {
    if (isCollection) {
      message += `Thank you for your Collection Request with The Snack Merchant 🙌

We have received your request and are checking local Centurion stock availability.

${orderSummary}

No payment is required yet.

Next step: We will confirm local stock availability and then send payment instructions if approved.`;
    } else if (paymentMethodLabel === "EFT / Proof of Payment") {
      message += `Thank you for your order with The Snack Merchant 🙌

We have received your order and it is now awaiting EFT payment.

${orderSummary}
${deliveryDetails}

Please complete payment using the banking details below:

${eftDetails}

Once paid, please send proof of payment on WhatsApp so we can confirm and prepare your order.`;
    } else {
      message += `Thank you for your order with The Snack Merchant 🙌

We have received your order and will process it shortly.

${orderSummary}
${deliveryDetails}`;
    }
  }

  if (orderStatus === "Pending Stock Confirmation") {
    message += `Thank you for your Collection Request with The Snack Merchant 🙌

We are currently checking local Centurion stock availability.

${orderSummary}

No payment is required yet.

Next step: We will confirm whether collection stock is available. If approved, we will send payment instructions.`;
  }

 if (orderStatus === "Collection Approved") {
  message += `Good news – your collection request has been approved ✅

Your items are available locally for Centurion collection.

${orderSummary}

Total Amount Payable:
R${formatMoney(orderTotal)}

Please choose your preferred payment option:

OPTION 1 – EFT PAYMENT

${eftDetails}

Once paid, please send proof of payment on WhatsApp so we can confirm your collection details.

OPTION 2 – SECURE ONLINE PAYMENT

If you prefer to pay online, reply PAYFAST and we will send you a secure PayFast payment link.

Payment must be completed before collection.`;
}

  if (orderStatus === "Converted to PUDO Delivery") {
    message += `Your collection request has been reviewed.

Unfortunately, local Centurion stock is not currently available for one or more of the requested items. To fulfil your order, it now needs to be converted to a PUDO Locker Delivery order.

As a result, additional PUDO delivery charges will apply.

${orderSummary}

Additional PUDO Delivery Fee:
R${formatMoney(convertedPudoFee)}

Revised Total Payable Including PUDO Delivery:
R${formatMoney(convertedPudoTotal)}

Next step:
Please confirm via WhatsApp on 068 759 7884 whether you would like us to proceed with the PUDO Locker Delivery order.

Please also send your preferred PUDO locker / delivery address so we can finalise the delivery arrangement.

Once we receive your confirmation and delivery details, we will update your order and send payment instructions.

You will be able to choose either:

• EFT payment
• Secure PayFast online payment

Payment is required before dispatch.

If you do not wish to proceed, please let us know and we will cancel the order.

If we do not receive confirmation within 3 business days, the order will be cancelled and any reserved stock will be released.`;
  }

if (orderStatus === "Awaiting Payment") {
  message += `Your order is approved and awaiting payment.

${orderSummary}
${deliveryDetails}

Total Amount Payable:
R${formatMoney(orderTotal)}

Please choose your preferred payment option:

OPTION 1 – EFT PAYMENT

${eftDetails}

Once paid, please send proof of payment on WhatsApp so we can confirm and prepare your order.

OPTION 2 – SECURE ONLINE PAYMENT

If you prefer to pay online, reply PAYFAST and we will send you a secure PayFast payment link.

Payment must be completed before ${isDelivery ? "dispatch" : "collection"}.`;
}  

  if (orderStatus === "Paid") {
    message += `Payment received ✅

Thank you. Your payment has been confirmed and your order is now being prepared.

${orderSummary}
${deliveryDetails}`;

    if (isCollection) {
      message += `

Next step: We will let you know as soon as your order is ready for collection.`;
    }

    if (isDelivery) {
      message += `

Next step: We will prepare your order for PUDO delivery and send the waybill / PIN details once dispatched.`;
    }
  }

  if (orderStatus === "Ready for Collection") {
  message += `${orderSummary}

Good news — your order is ready for collection ✅

Please collect your order at the agreed collection point.

Once collected, we will close the order.

Thank you for supporting The Snack Merchant.`;
}

if (orderStatus === "Dispatched") {
  message += `${orderSummary}
${deliveryDetails}

Good news — your order has been dispatched via PUDO Locker Delivery ✅

Your PUDO tracking details will be sent to you separately via WhatsApp once your parcel has been processed by PUDO.

Waybill Number: To be provided
PUDO PIN: To be provided

Please keep the PIN safe. You will need it to collect your parcel from your selected PUDO locker or kiosk.

Thank you for supporting The Snack Merchant.`;
}

  if (orderStatus === "Closed") {
    message += `${orderSummary}

Your order has been completed ✅

Thank you for supporting The Snack Merchant 🌰`;
    message += `

The Snack Merchant 🌰`;
    return message;
  }

  if (orderStatus === "Cancelled") {
    message += `${orderSummary}

Your order has been cancelled.

No further action is required. If you would still like to order, please place a new order through The Snack Merchant app or contact us via WhatsApp on 068 759 7884.`;
    message += `

The Snack Merchant 🌰`;
    return message;
  }

  message += `

The Snack Merchant 🌰`;

  return message;
};

const generateInvoicePDF = (order) => {
  const doc = new jsPDF();

  const orderStatus = normalizeOrderStatus(order.order_status);
  const paymentStatus = order.payment_status || "-";
  const isPaid = paymentStatus === "Paid" || orderStatus === "Paid";
  const isFinal =
    ["Paid", "Ready for Collection", "Dispatched", "Closed"].includes(orderStatus);

  const invoiceTitle = isPaid || isFinal ? "PAID INVOICE" : "PRO FORMA INVOICE";

  const productsTotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );

  const deliveryFee = Number(order.delivery_fee || 0);
  const hasDeliveryFee = deliveryFee > 0;
  const finalTotal = Number(order.total_amount || productsTotal + deliveryFee);

  // ================= HEADER =================
  try {
    doc.addImage("/invoice-logo.png", "PNG", 18, 10, 28, 28);
  } catch (error) {
    console.warn("Invoice logo could not be loaded:", error);
  }

  doc.setFontSize(22);
  doc.setTextColor(212, 175, 55);
  doc.text("THE SNACK MERCHANT", 52, 22);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Artisan Nuts • Dried Fruit • Snacks", 52, 30);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("WhatsApp Orders: 068 759 7884", 52, 38);
  doc.text("https://snack-merchant-app.vercel.app/", 52, 45);

  // ================= INVOICE INFO =================
  doc.setFontSize(16);
  doc.setTextColor(isPaid || isFinal ? 20 : 160, isPaid || isFinal ? 120 : 90, 20);
  doc.text(invoiceTitle, 145, 20);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice #: ${order.order_number}`, 145, 30);
  doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 145, 38);

  // ================= STATUS BOX =================
 doc.setDrawColor(212, 175, 55);
doc.setLineWidth(0.4);
doc.rect(105, 55, 85, 35);

doc.setFontSize(9);
doc.text("Order Status", 109, 63);

doc.setFontSize(11);
const wrappedOrderStatus = doc.splitTextToSize(orderStatus || "-", 76);
doc.text(wrappedOrderStatus, 109, 72);

    // ================= CUSTOMER DETAILS =================
  doc.setFontSize(13);
  doc.setTextColor(212, 175, 55);
  doc.text("Customer Details", 20, 60);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Name: ${order.customer_name || "-"}`, 20, 70);
  doc.text(`Phone: ${order.customer_phone || "-"}`, 20, 78);
  doc.text(`Email: ${order.customer_email || "Not provided"}`, 20, 86);
  doc.text(`Order Type: ${order.order_type || "-"}`, 20, 94);
  

  if (hasDeliveryFee) {
    doc.text(`Delivery / PUDO Fee: R${deliveryFee.toFixed(2)}`, 20, 110);
  }

  // ================= ITEMS TABLE =================
  autoTable(doc, {
    startY: hasDeliveryFee ? 122 : 114,
    head: [["Product", "Size", "Qty", "Unit Price", "Line Total"]],
    body: [
      ...(order.items || []).map((item) => {
        const unitPrice = Number(item.price || 0);
        const qty = Number(item.qty || 0);

        return [
          item.name || "-",
          item.size || "-",
          qty,
          `R${unitPrice.toFixed(2)}`,
          `R${(unitPrice * qty).toFixed(2)}`,
        ];
      }),
      ...(hasDeliveryFee
        ? [["PUDO Delivery", "-", 1, `R${deliveryFee.toFixed(2)}`, `R${deliveryFee.toFixed(2)}`]]
        : []),
    ],
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [212, 175, 55],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 248, 235],
    },
  });

  // ================= TOTALS =================
  const finalY = doc.lastAutoTable.finalY + 12;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Products Total: R${productsTotal.toFixed(2)}`, 130, finalY);

  if (hasDeliveryFee) {
    doc.text(`Delivery / PUDO Fee: R${deliveryFee.toFixed(2)}`, 130, finalY + 8);
  }

  doc.setFontSize(14);
  doc.setTextColor(212, 175, 55);
  doc.text(`Final Total: R${finalTotal.toFixed(2)}`, 130, hasDeliveryFee ? finalY + 18 : finalY + 10);

  // ================= PAYMENT / CONFIRMATION SECTION =================
 
const paymentY = hasDeliveryFee ? finalY + 35 : finalY + 28;

const paymentNotRequiredYet = [
  "New Order",
  "Pending Stock Confirmation",
].includes(orderStatus);

doc.setFontSize(13);
doc.setTextColor(212, 175, 55);

if (isPaid || isFinal) {
  doc.text("Payment Confirmation", 20, paymentY);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Payment has been received for this order.", 20, paymentY + 10);
  doc.text("Thank you for your purchase from The Snack Merchant.", 20, paymentY + 18);
} else if (paymentNotRequiredYet) {
  const isCollectionOrder = order.order_type === "Collection";

  doc.text("Payment Status", 20, paymentY);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text(
    "This is a pro forma invoice for order review only.",
    20,
    paymentY + 10
  );

  doc.text("Payment is not required yet.", 20, paymentY + 18);

  if (isCollectionOrder) {
    doc.text(
      "We will confirm local Centurion stock availability before requesting payment.",
      20,
      paymentY + 28
    );
  } else {
    doc.text("Payment is required before dispatch.", 20, paymentY + 28);

    doc.text(
      "Please use your Order Number as the payment reference.",
      20,
      paymentY + 38
    );
  }
} else {

    doc.text("Payment Instructions", 20, paymentY);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text("This is a pro forma invoice. Payment is required before collection or dispatch.", 20, paymentY + 10);

  doc.text("EFT Banking Details:", 20, paymentY + 22);
  doc.text(`Bank: ${EFT_BANK}`, 20, paymentY + 30);
  doc.text(`Account Name: ${EFT_ACCOUNT_NAME}`, 20, paymentY + 38);
  doc.text(`Account Number: ${EFT_ACCOUNT_NUMBER}`, 20, paymentY + 46);
  doc.text(`Branch Code: ${EFT_BRANCH_CODE}`, 20, paymentY + 54);
  doc.text(
  `Reference: ${order.order_number || ""}`,
  20,
  paymentY + 62
);

  doc.text("For PayFast online payment, please use the secure payment link sent separately.", 20, paymentY + 74);
}
  // ================= FOOTER =================
  const pageHeight = doc.internal.pageSize.height;

  doc.setDrawColor(212, 175, 55);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("The Snack Merchant • Quality You Can Taste", 20, pageHeight - 17);
  doc.text("WhatsApp Orders: 068 759 7884", 20, pageHeight - 11);
  doc.text("Prices and stock availability are subject to confirmation.", 110, pageHeight - 11);

  const blobUrl = doc.output("bloburl");
  window.open(blobUrl, "_blank");
};

const generateReceiptPDF = (order) => {
  const doc = new jsPDF();

  const orderStatus = normalizeOrderStatus(order.order_status);
  const productsTotal = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );

  const deliveryFee = Number(order.delivery_fee || 0);
  const hasDeliveryFee = deliveryFee > 0;
  const finalTotal = Number(order.total_amount || productsTotal + deliveryFee);

  // ================= HEADER =================
  try {
    doc.addImage("/invoice-logo.png", "PNG", 18, 10, 28, 28);
  } catch (error) {
    console.warn("Receipt logo could not be loaded:", error);
  }

  doc.setFontSize(22);
  doc.setTextColor(212, 175, 55);
  doc.text("THE SNACK MERCHANT", 52, 22);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Artisan Nuts • Dried Fruit • Snacks", 52, 30);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("WhatsApp Orders: 068 759 7884", 52, 38);
  doc.text("https://snack-merchant-app.vercel.app/", 52, 45);

  // ================= RECEIPT INFO =================
  doc.setFontSize(14);
  doc.setTextColor(20, 120, 20);
  doc.text("PAYMENT RECEIPT", 145, 20);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Receipt #: ${order.order_number}`, 135, 30);
  doc.text(`Date: ${new Date().toLocaleString()}`, 135, 38);

  // ================= STATUS BOX =================
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.rect(105, 55, 85, 35);

  doc.setFontSize(9);
  doc.text("Receipt Status", 109, 63);

  doc.setFontSize(11);
  doc.text("PAID", 109, 72);

  doc.setFontSize(9);
  doc.text("Order Status", 109, 80);

  doc.setFontSize(11);
  const wrappedOrderStatus = doc.splitTextToSize(orderStatus || "-", 76);
  doc.text(wrappedOrderStatus, 109, 87);

  // ================= CUSTOMER DETAILS =================
  doc.setFontSize(13);
  doc.setTextColor(212, 175, 55);
  doc.text("Customer Details", 20, 60);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Name: ${order.customer_name || "-"}`, 20, 70);
  doc.text(`Phone: ${order.customer_phone || "-"}`, 20, 78);
  doc.text(`Email: ${order.customer_email || "Not provided"}`, 20, 86);
  doc.text(`Order Type: ${order.order_type || "-"}`, 20, 94);

  // ================= ITEMS TABLE =================
  autoTable(doc, {
    startY: 112,
    head: [["Product", "Size", "Qty", "Unit Price", "Line Total"]],
    body: [
      ...(order.items || []).map((item) => {
        const unitPrice = Number(item.price || 0);
        const qty = Number(item.qty || 0);

        return [
          item.name || "-",
          item.size || "-",
          qty,
          `R${unitPrice.toFixed(2)}`,
          `R${(unitPrice * qty).toFixed(2)}`,
        ];
      }),
      ...(hasDeliveryFee
        ? [["PUDO Delivery", "-", 1, `R${deliveryFee.toFixed(2)}`, `R${deliveryFee.toFixed(2)}`]]
        : []),
    ],
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [212, 175, 55],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [250, 248, 235],
    },
  });

  // ================= TOTAL PAID =================
  const finalY = doc.lastAutoTable.finalY + 12;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Products Total: R${productsTotal.toFixed(2)}`, 130, finalY);

  if (hasDeliveryFee) {
    doc.text(`Delivery / PUDO Fee: R${deliveryFee.toFixed(2)}`, 130, finalY + 8);
  }

  doc.setFontSize(15);
  doc.setTextColor(20, 120, 20);
  doc.text(`Total Paid: R${finalTotal.toFixed(2)}`, 130, hasDeliveryFee ? finalY + 18 : finalY + 10);

  // ================= RECEIPT CONFIRMATION =================
  const receiptY = hasDeliveryFee ? finalY + 35 : finalY + 28;

  doc.setFontSize(13);
  doc.setTextColor(212, 175, 55);
  doc.text("Payment Confirmation", 20, receiptY);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Payment has been received for this order.", 20, receiptY + 10);
  doc.text("This receipt confirms payment received by The Snack Merchant.", 20, receiptY + 18);
  doc.text("Thank you for your purchase.", 20, receiptY + 26);

  // ================= FOOTER =================
  const pageHeight = doc.internal.pageSize.height;

  doc.setDrawColor(212, 175, 55);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("The Snack Merchant • Quality You Can Taste", 20, pageHeight - 17);
  doc.text("WhatsApp Orders: 068 759 7884", 20, pageHeight - 11);
  doc.text("Receipt generated after payment confirmation.", 110, pageHeight - 11);

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

  const buildOrderPayload = () => {
  const orderStatus =
    customer.orderType === "Collection"
      ? "Pending Stock Confirmation"
      : "Awaiting Payment";

  const paymentStatus =
    customer.orderType === "Collection"
      ? "Pending Stock Confirmation"
      : "Awaiting Payment";

  return {
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    orderType: customer.orderType,
    paymentMethod:
    customer.orderType === "Collection"
    ? "Pending after stock confirmation"
    : paymentMethod,
    deliveryAddress: customer.address,
    customerNotes: customer.notes,
    items: cart,
    totalAmount: total,
    deliveryFee: deliveryFee,
    orderStatus,
    paymentStatus,
  };
};

const validateOrderDetails = () => {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return false;
  }

  if (!customer.name.trim() || !customer.phone.trim()) {
    alert("Please enter your name and phone number before placing the order.");
    return false;
  }

  if (customer.orderType === "Delivery" && !customer.address.trim()) {
    alert("Please enter your delivery address.");
    return false;
  }

  return true;
};


const resetCheckoutForm = () => {
  setCart([]);
  setCustomer({
    name: "",
    phone: "",
    email: "",
    orderType: "Collection",
    address: "",
    notes: "",
  });
  setPaymentMethod("EFT / Proof of Payment");
  setShowOrderConfirm(false);
  setShowEftConfirm(false);
  localStorage.removeItem("pendingPayfastOrderId");
};

const saveOrderOnly = async () => {
  if (!validateOrderDetails()) {
    throw new Error("Order validation failed");
  }

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildOrderPayload()),
  });

  if (!response.ok) {
    throw new Error("Failed to save order");
  }

 const data = await response.json();

if (!data.success || !data.order) {
  throw new Error("Order could not be saved");
}

await loadOrders();

return data.order;
};

const submitEftOrder = async () => {
  try {
    const savedOrder = await saveOrderOnly();

setOrderSuccessNumber(savedOrder.order_number);

setOrderSuccessType(
  customer.orderType === "Collection" ? "collection" : "eft"
);
    setShowOrderConfirm(false);
    setShowOrderSuccess(true);
  } catch (error) {
    console.error("EFT order error:", error);
    alert("Failed to save order. Please try again.");
  }
};

const payWithPayFast = async () => {
  try {
    const savedOrder = await saveOrderOnly();
    localStorage.setItem("pendingPayfastOrderId", savedOrder.id);

    const orderDescription = cart
      .map((item) => `${item.code} ${item.name} ${item.size} x${item.qty}`)
      .join(" | ")
      .slice(0, 240);

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
          customerEmail: customer.email || "customer@example.com",
          orderNumber: savedOrder.order_number,
          itemName: cart
             .map((item) => `${item.code} ${item.name} ${item.size} x${item.qty}`)
             .join(", ")
              .slice(0, 100),
        }),
      }
    );

    const data = await response.json();

    if (!data.paymentUrl) {
      alert("Your order was saved, but the PayFast payment link could not be created. Please contact us or choose EFT.");
      return;
    }

    window.location.href = data.paymentUrl;
  } catch (error) {
    console.error("PayFast error:", error);
    alert("Payment could not be started. Please try again or use EFT.");
  }
};

if (!showShop) {
const productHighlights = [
  {
    title: "Premium Nuts",
    image: "/website/Mixed Nuts.png"
  },
  {
    title: "Dried Fruit",
    image: "/website/Dried fruit mix.png"
  },
  {
    title: "Seeds & Health Pantry",
    image: "/website/Seeds and Healthy Pantry.jpg.png"
  },
  {
    title: "Chocolate & Yoghurt Treats",
    image: "/website/Milky Bar Almonds.png"
  },
  {
    title: "Honey",
    image: "/website/Crazy Bee Honey GlassBottle.png"
  },
  {
    title: "Gift Packs & Events",
    image: "/website/Gift Packs.jpg.png"
  }
];
if (selectedCategoryPage) {
  const categoryContent = {
"premium-nuts": {
  eyebrow: "Origins • Nutrition • Fun Facts",
  title: "Premium Nuts",
  heroImage: "/website/Premium Nuts/PremiumNutsBanner.jpg",
  description:
    "From ancient pistachio orchards to South African macadamia farms, premium nuts have travelled across continents and cultures for thousands of years. Explore where they grow, what makes them unique, and the fascinating stories behind some of the world's most loved nuts.",
  learnMoreTitle: "Learn More About Premium Nuts",
    worldIntro:
  "Premium nuts are grown in very specific climates, from warm orchards in South Africa to historic growing regions across the world.",
    items: [
    {
      title: "Almonds",
      image: "/website/Premium Nuts/Almonds 1.jpg",
      description:
        "Almonds are actually seeds, not true nuts, and belong to the same family as peaches and apricots."
    },
    {
      title: "Cashews",
      image: "/website/Premium Nuts/Cashew 1.jpg",
      description:
        "Cashews grow beneath the colourful cashew apple and are harvested by hand in many regions."
    },
    {
      title: "Macadamias",
      image: "/website/Premium Nuts/Mac 1.jpg",
      description:
        "Macadamia trees can take up to 10 years before producing commercial harvests and may produce for over 100 years."
    },
    {
      title: "Pistachios",
      image: "/website/Premium Nuts/Pista 1.jpg",
      description:
        "Pistachios have been enjoyed for more than 9,000 years and were once considered a royal delicacy."
    },
    {
      title: "Pecans",
      image: "/website/Premium Nuts/Pecan 1.jpg",
      description:
        "Pecans are native to North America and are naturally rich in healthy fats and antioxidants."
    },
    {
      title: "Mixed Nuts",
      image: "/website/Premium Nuts/Mix 2.jpg",
      description:
        "Mixed nuts combine a variety of textures, flavours and nutrients into one convenient snack."
    }
  ],
  didYouKnow: [
    {
      stat: "9,000 Years",
      title: "Ancient Snack",
      text: "Pistachios are among the oldest cultivated nuts known to mankind."
    },
    {
      stat: "100 Years",
      title: "Long-Living Orchards",
      text: "A healthy macadamia orchard can remain productive for generations."
    },
    {
      stat: "Not True Nuts",
      title: "Almond Surprise",
      text: "Almonds are seeds from a fruit rather than true botanical nuts."
    }
  ],
  growingRegions: [
  {
    nut: "Almonds",
    regions: ["USA", "Spain", "Australia"]
  },
  {
    nut: "Cashews",
    regions: ["Vietnam", "India", "Africa"]
  },
  {
    nut: "Macadamias",
    regions: ["South Africa", "Australia"]
  },
  {
    nut: "Pistachios",
    regions: ["USA", "Iran", "Turkey"]
  },
  {
    nut: "Pecans",
    regions: ["USA", "Mexico"]
  }
],
  nutritionFacts: [
  {
    title: "Protein",
    value: "Muscle Support",
    description:
      "Protein helps support muscle maintenance and contributes to feelings of fullness."
  },
  {
    title: "Healthy Fats",
    value: "Natural Energy",
    description:
      "Nuts contain beneficial fats that provide long-lasting energy throughout the day."
  },
  {
    title: "Fibre",
    value: "Digestive Health",
    description:
      "Fibre supports healthy digestion and helps maintain balanced eating habits."
  },
  {
    title: "Vitamin E",
    value: "Antioxidant Power",
    description:
      "Many nuts naturally contain Vitamin E, an important antioxidant nutrient."
  }
],
   learnMore: [
  {
  title: "How Macadamias Are Harvested",
  description: "See how macadamias are grown, harvested and processed before becoming a premium snack.",
  url: "https://www.youtube.com/watch?v=EN2V5uHuqi4"
},
  {
  title: "The Story of Pistachios",
  description: "Learn why pistachios are one of the oldest and most fascinating nuts in the world.",
  url: "https://www.youtube.com/watch?v=CqPzt8d922E"
},
  {
  title: "How Cashews Grow",
  description: "Discover why cashews are one of the most unusual nuts to grow and harvest.",
  url: "https://www.youtube.com/watch?v=ns-lKaXx-BU"
},
  {
  title: "Almond Farming Explained",
  description: "Explore how almonds are cultivated and why they are so popular worldwide.",
  url: "https://www.youtube.com/watch?v=ql9NIPilcPI"
},
]
},

"dried-fruit": {
  eyebrow: "Origins • Drying Methods • Fruit Facts",
  title: "Dried Fruit",
  description:
    "From sun-dried raisins to tropical mango strips, dried fruit has helped people preserve flavour, nutrition and seasonal harvests for thousands of years. Discover how fruit is dried, where it originates and why it remains one of the world's most popular natural snacks.",
learnMoreTitle: "Learn More About Dried Fruit",
    worldIntro:
  "Different fruits thrive in different climates around the world, from tropical mango farms in South Africa and India to historic date-growing regions across the Middle East.",
  items: [
  {
    title: "Dried Mango",
    image: "/website/Dried Fruit/Dried Fruit 5.jpg",
    description:
      "Mango is often dried to preserve its tropical flavour while creating a chewy texture and concentrated natural sweetness."
  },
  {
    title: "Diced Fruit Range",
    image: "/website/Dried Fruit/Diced Fruit 1.jpg",
    description:
      "Colourful fruit cubes are popular in baking, snack mixes and lunchboxes because they add sweetness and texture."
  },
  {
    title: "Raisins",
    image: "/website/Dried Fruit/Raisins.jpg",
    description:
      "Raisins are dried grapes and have been enjoyed for thousands of years as a naturally sweet, energy-rich snack."
  },
  {
    title: "Dates",
    image: "/website/Dried Fruit/Dates.jpg",
    description:
      "Dates have long been valued as a naturally sweet energy source across the Middle East and North Africa."
  },
  {
    title: "Apricots & Peaches",
    image: "/website/Dried Fruit/Dried Fruit 7.jpg",
    description:
      "Dried apricots and peaches are popular for their sweet flavour, vibrant colour and naturally chewy texture."
  }

],

  didYouKnow: [
    {
      stat: "Ancient Method",
      title: "Natural Preservation",
      text: "Drying fruit is one of the oldest food preservation techniques used by humans."
    },
    {
      stat: "5x Smaller",
      title: "Concentrated Flavour",
      text: "Fruit shrinks significantly during drying as water is removed and flavour becomes concentrated."
    },
    {
      stat: "Travel Food",
      title: "Portable Energy",
      text: "Dried fruit became popular because it stores well and provides convenient natural energy."
    }
  ],

  growingRegions: [
    {
      nut: "Mango",
      regions: ["South Africa", "India", "Thailand"]
    },
    {
      nut: "Grapes",
      regions: ["South Africa", "USA", "Turkey"]
    },
    {
      nut: "Dates",
      regions: ["Saudi Arabia", "Egypt", "UAE"]
    },
    {
      nut: "Cranberries",
      regions: ["USA", "Canada"]
    }
  ],

  nutritionFacts: [
    {
      title: "Fruit Sugars",
      value: "Natural Energy",
      description:
        "Dried fruit contains concentrated natural fruit sugars that provide quick energy."
    },
    {
      title: "Fibre",
      value: "Digestive Health",
      description:
        "Many dried fruits are naturally rich in fibre which supports healthy digestion."
    },
    {
      title: "Potassium",
      value: "Minerals",
      description:
        "Several dried fruits provide potassium which helps support normal body functions."
    },
    {
      title: "Plant Compounds",
      value: "Antioxidants",
      description:
        "Colourful fruits naturally contain antioxidant compounds."
    }
  ],

  learnMore: [
  {
    title: "How Raisins Are Made",
    description:
      "Discover how grapes are transformed into one of the world's most popular dried fruits.",
    url: "https://www.youtube.com/watch?v=smnz5qVzTrA"
  },
  {
    title: "The History of Dates",
    description:
      "Explore the farming and history behind one of humanity's oldest cultivated fruits.",
    url: "https://www.youtube.com/watch?v=YmbU5XYGhQ4"
  },
  {
    title: "How Mango Is Dried",
    description:
      "See how tropical mangoes are processed into chewy dried fruit snacks.",
    url: "https://www.youtube.com/watch?v=OEE3bUNmQ7A"
  },
  {
  title: "The Science of Food Drying",
  description:
    "Discover how removing moisture helps preserve fruit and concentrate flavour.",
  url: "https://www.youtube.com/watch?v=WcKJi-UZlac"
}
]
},

    "seeds-health": {
  eyebrow: "Ancient Superfoods • Natural Nutrition • Pantry Staples",
  title: "Seeds & Health Pantry",
  heroImage: "/website/Seeds/Healthy.jpg",
  description:
    "Seeds and pantry staples have nourished people for thousands of years. From chia and linseed to sesame, sunflower and oats, these small ingredients carry big stories, global origins and everyday nutritional value.",
  worldIntro:
    "Seeds and health pantry foods are grown across many regions of the world, from chia fields in Latin America to sesame, sunflower and grain-producing regions across Africa, Europe and Asia.",
  learnMoreTitle: "Learn More About Seeds & Health Pantry",

  items: [
    {
      title: "Chia Seeds",
      image: "/website/Seeds/Chia.jpg",
      description:
        "Tiny seeds packed with fibre, omega-3 fatty acids and plant-based nutrition."
    },
    {
      title: "Linseed",
      image: "/website/Seeds/Linseed.jpg",
      description:
        "A traditional seed valued for fibre, plant-based omega-3 and everyday wellness."
    },
    {
      title: "Pumpkin Seeds",
      image: "/website/Seeds/pumpkin.jpg",
      description:
        "Crunchy green seeds naturally rich in minerals, protein and healthy fats."
    },
    {
      title: "Sesame Seeds",
      image: "/website/Seeds/Sesame.jpg",
      description:
        "One of the world's oldest cultivated crops, used in baking, cooking and traditional foods."
    },
    {
      title: "Sunflower Seeds",
      image: "/website/Seeds/Sunflower.jpg",
      description:
        "Popular seeds valued for their crunch, healthy fats and Vitamin E."
    },
    
 {
  title: "Trail Mixes",
  image: "/website/Seeds/Trail Mix.jpg",
  description:
    "Convenient snack blends combining seeds, fruit and nuts for energy, texture and variety."
},
  ],

  didYouKnow: [
    {
      stat: "Aztec Fuel",
      title: "Chia History",
      text: "Chia seeds were valued by ancient civilizations as an energy-rich food."
    },
    {
      stat: "Oldest Crops",
      title: "Sesame Heritage",
      text: "Sesame is one of the oldest oilseed crops cultivated by humans."
    },
    {
  stat: "10,000 Years",
  title: "Barley Heritage",
  text: "Barley was one of the world's first cultivated crops and has been grown for more than 10,000 years."
}
  ],

  growingRegions: [
    {
      nut: "Chia",
      regions: ["Mexico", "Argentina", "Bolivia"]
    },
    {
      nut: "Linseed",
      regions: ["Canada", "Russia", "China"]
    },
    {
      nut: "Pumpkin",
      regions: ["China", "Ukraine", "USA"]
    },
    {
      nut: "Sunflower",
      regions: ["Ukraine", "Russia", "Argentina"]
    },
    {
      nut: "Sesame",
      regions: ["India", "Sudan", "Ethiopia"]
    }
  ],

  nutritionFacts: [
    {
      title: "Plant Protein",
      value: "Everyday Fuel",
      description:
        "Many seeds provide plant-based protein that supports balanced everyday eating."
    },
    {
      title: "Omega-3",
      value: "Healthy Fats",
      description:
        "Chia and linseed are well known for naturally occurring plant-based omega-3 fats."
    },
    {
      title: "Fibre",
      value: "Digestive Health",
      description:
        "Seeds and oats can contribute dietary fibre for digestive wellness."
    },
    {
      title: "Minerals",
      value: "Natural Nutrients",
      description:
        "Pumpkin, sesame and sunflower seeds contain minerals such as magnesium and zinc."
    }
  ],

learnMore: [
  {
    title: "How Chia Seeds Grow",
    description:
      "Travel to the fields where chia is cultivated and discover how this ancient Aztec superfood became a modern health staple.",
    url: "https://www.youtube.com/watch?v=lVBgSzzsYtE"
  },
  {
    title: "The Story of Sesame",
    description:
      "Explore the fascinating history of sesame, one of the world's oldest cultivated crops, and its journey across civilizations.",
    url: "https://www.youtube.com/watch?v=q-zQNKe3Lak"
  },
 {
  title: "Barley: The Ancient Grain",
  description:
    "Learn how barley became one of the world's earliest cultivated grains and why it remains an important pantry staple today.",
  url: "https://www.youtube.com/watch?v=33AsVbHtLm8"
},
  {
    title: "Why Seeds Are Nutrient Dense",
    description:
      "Learn why tiny seeds naturally contain concentrated fibre, minerals, healthy fats and plant-based nutrition.",
    url: "https://www.youtube.com/watch?v=xLQFhfSpaGc"
  }
]
},
    "chocolate-yoghurt": {
  eyebrow: "Chocolate • Yoghurt Treats • Candy Favourites",
  title: "Chocolate, Candy & Yoghurt Treats",
  heroImage: "/website/Chocolate & Yoghurt/Yogurt.jpg",
  description:
    "From chocolate-coated nuts and yoghurt treats to colourful candy favourites...",
 items: [
  {
    title: "Chocolate Almonds",
    image: "/website/Chocolate & Yoghurt/Choc Almonds.jpg",
    description:
      "Premium almonds coated in smooth chocolate for a rich and satisfying treat."
  },
  {
    title: "Chocolate Peanuts",
    image: "/website/Chocolate & Yoghurt/Choc Peanuts.jpg",
    description:
      "Crunchy peanuts covered in chocolate and enjoyed as a timeless snack favourite."
  },
  {
    title: "Chocolate Cashews",
    image: "/website/Chocolate & Yoghurt/Choc Cashew.jpg",
    description:
      "Creamy cashews paired with chocolate to create a luxurious sweet-and-nutty combination."
  },
  {
    title: "Milky Bar Almonds",
    image: "/website/Chocolate & Yoghurt/Milky Bar Almonds.jpg",
    description:
      "A creamy white chocolate coating surrounding premium almonds."
  },
  {
    title: "Yoghurt Treats",
    image: "/website/Chocolate & Yoghurt/Yogurt.jpg",
    description:
      "Smooth yoghurt-coated snacks combining sweetness with a creamy finish."
  },
  {
    title: "Candy & Chocolate Mixes",
    image: "/website/Chocolate & Yoghurt/Spec Eggs.jpg",
    description:
      "Colourful candy-coated treats perfect for sharing, gifting and celebrations."
  }
],
didYouKnow: [
  {
    stat: "4,000 Years",
    title: "Chocolate Origins",
    text: "Chocolate traces its roots to ancient Central American civilizations that first cultivated cacao."
  },
  {
    stat: "Worldwide Favourite",
    title: "Candy Culture",
    text: "Every country has unique confectionery traditions and sweet treats enjoyed for generations."
  },
  {
    stat: "Sweet & Crunchy",
    title: "Coated Nuts",
    text: "Combining nuts with chocolate creates one of the world's most popular snack combinations."
  }
],
growingRegions: [
  {
    nut: "Cacao",
    regions: ["Ghana", "Ivory Coast", "Ecuador"]
  },
  {
    nut: "Almonds",
    regions: ["USA", "Spain", "Australia"]
  },
  {
    nut: "Peanuts",
    regions: ["China", "India", "USA"]
  },
  {
    nut: "Sugar",
    regions: ["Brazil", "India", "Thailand"]
  },
  {
    nut: "Vanilla",
    regions: ["Madagascar", "Indonesia", "Mexico"]
  }
],
nutritionFacts: [
  {
    title: "Energy",
    value: "Quick Fuel",
    description:
      "Chocolate and confectionery products provide convenient energy for active lifestyles."
  },
  {
    title: "Cacao",
    value: "Natural Compounds",
    description:
      "Cacao naturally contains plant compounds that contribute to its unique flavour profile."
  },
  {
    title: "Nuts",
    value: "Crunch & Texture",
    description:
      "Almonds, peanuts and cashews add texture, flavour and nutritional value."
  },
  {
    title: "Treat Balance",
    value: "Enjoy In Moderation",
    description:
      "Treat foods are best enjoyed as part of a balanced and varied diet."
  }
],
learnMoreTitle: "Learn More About Chocolate & Candy Treats",

learnMore: [
  {
    title: "The Story of Chocolate",
    description:
      "Explore how cacao became one of the world's most loved ingredients.",
    url: "https://www.youtube.com/watch?v=ibjUpk9Iagk"
  },
  {
    title: "How Chocolate Is Made",
    description:
      "See how cacao beans are processed into smooth chocolate.",
    url: "https://www.youtube.com/watch?v=P_JuQCiKWUc"
  },
  {
    title: "How Hard Candy Is Made",
    description:
      "See how traditional hard candy is stretched, shaped and turned into colourful sweets.",
    url: "https://www.youtube.com/watch?v=6MoBvV12C58"
  },
{
  title: "Lemon Yogurt Coated Almonds",
  description:
    "See how yogurt coatings are combined with almonds to create a creamy, tangy confectionery snack.",
  url: "https://www.youtube.com/watch?v=-DkUPNh3pOM"
}
],
},

  "honey": {
  eyebrow: "Bees • Honey • Natural Sweetness",
  title: "Honey & Honey Roasted Treats",
  heroImage: "/website/Honey/Hon 2.jpg",
  description:
    "For thousands of years honey has been treasured as one of nature's most remarkable foods. Discover the story of bees, honey production and the delicious snacks inspired by this golden ingredient.",
  worldIntro:
    "Honey is produced on every continent except Antarctica, with unique flavours and traditions shaped by local flowers, climates and bee species.",
  learnMoreTitle: "Learn More About Honey",

  items: [
    {
      title: "Pure Honey",
      image: "/website/Honey/Hon 1.jpg",
      description:
        "Natural honey collected by bees and enjoyed for its sweetness, colour and versatility."
    },
    {
      title: "Raw Honey",
      image: "/website/Honey/Hon 2.jpg",
      description:
        "Minimally processed honey that keeps more of its natural character and flavour."
    },
    {
      title: "Honey Jars",
      image: "/website/Honey/Hon 3.jpg",
      description:
        "Honey can vary in colour, aroma and taste depending on the flowers visited by bees."
    },
    {
      title: "Honey Roasted Peanuts",
      image: "/website/Honey/Honey Roasted Peanuts.jpg",
      description:
        "Crunchy peanuts coated with honey for a sweet-and-savoury snack experience."
    },
    {
      title: "Honey Roasted Bananas",
      image: "/website/Honey/Honey Roasted Bananas.jpg",
      description:
        "Sweet banana slices enhanced with the rich flavour of honey."
    },
    {
      title: "Honey Sesame Cashews",
      image: "/website/Honey/Honey Sesame Roasted Cashew.jpg",
      description:
        "Premium cashews combined with honey and sesame for a unique gourmet treat."
    }
  ],
  didYouKnow: [
  {
    stat: "Never Spoils",
    title: "Ancient Honey",
    text: "Honey has been found preserved in ancient Egyptian tombs thousands of years old."
  },
  {
  stat: "55,000 Miles",
  title: "One Jar Of Honey",
  text: "A bee colony may collectively fly the equivalent of more than twice around the Earth to produce a single jar of honey."
},
  {
    stat: "Flower Powered",
    title: "Unique Flavour",
    text: "Honey changes colour, aroma and taste depending on the flowers visited by the bees."
  }
],

growingRegions: [
  {
    nut: "Fynbos Honey",
    regions: ["South Africa"]
  },
  {
    nut: "Manuka Honey",
    regions: ["New Zealand"]
  },
  {
    nut: "Acacia Honey",
    regions: ["Hungary", "Romania"]
  },
  {
  nut: "Sidr Honey",
  regions: ["Yemen", "Saudi Arabia"]
},
  {
    nut: "Orange Blossom",
    regions: ["Spain", "Mexico"]
  }
],

nutritionFacts: [
  {
    title: "Natural Sugars",
    value: "Quick Energy",
    description:
      "Honey contains natural sugars that provide fast, convenient energy."
  },
  {
    title: "Floral Variety",
    value: "Unique Taste",
    description:
      "The flowers bees visit influence honey colour, aroma and flavour."
  },
  {
    title: "Bee Enzymes",
    value: "Natural Process",
    description:
      "Bees add enzymes that help transform nectar into honey."
  },
  {
    title: "Trace Nutrients",
    value: "Small Amounts",
    description:
      "Honey can contain tiny amounts of minerals, plant compounds and pollen."
  }
],

learnMore: [
  {
    title: "Why Honey Never Spoils",
    description:
      "Discover the science behind honey's long shelf life and why ancient honey can remain preserved for thousands of years.",
    url: "https://www.youtube.com/watch?v=IGbzX44j5Wc"
  },
  {
    title: "Yemeni Sidr Honey",
    description:
      "Explore why Yemeni Sidr honey is one of the most respected and sought-after honeys in the world.",
    url: "https://www.youtube.com/watch?v=tcbn1cOOCQg"
  },
  {
    title: "The Bee Waggle Dance",
    description:
      "Learn how honey bees communicate food locations through one of nature's most fascinating dances.",
    url: "https://www.youtube.com/watch?v=12Q8FfyLLso"
  },
  {
  title: "How To Test Pure Honey",
  description:
    "Discover popular honey purity tests and learn which methods can help identify adulterated honey at home.",
  url: "https://www.youtube.com/watch?v=aey2vyV3vWc"
}
]
},
   "gift-packs": {
  eyebrow: "Celebrations • Corporate Gifts • Special Occasions",
  title: "Gift Packs & Events",
  heroImage: "/website/Gifts Events/Corp Gift 1.jpg",
  description:
    "From corporate appreciation gifts to festive hampers and special event packs, discover thoughtful snack gifting ideas for every occasion.",
  worldIntro:
    "Gift giving has been part of human culture for thousands of years, from harvest celebrations and festivals to modern corporate appreciation and personal milestones.",
  learnMoreTitle: "Learn More About Gift Giving",

  items: [
    {
      title: "Corporate Gifts",
      image: "/website/Gifts Events/Corp Gift.jpg",
      description:
        "Professional gift packs designed for clients, employees and business appreciation."
    },
    {
      title: "Appreciation Boxes",
      image: "/website/Gifts Events/Appreciation.jpg",
      description:
        "Thoughtful gifts created to celebrate achievements, milestones and gratitude."
    },
    {
      title: "Father's Day Gifts",
      image: "/website/Gifts Events/Fathersday 2.jpg",
      description:
        "Curated snack gifts created for dads, fathers and family celebrations."
    },
    {
      title: "Festive Gift Packs",
      image: "/website/Gifts Events/XMas.jpg",
      description:
        "Seasonal gift collections perfect for festive occasions and year-end celebrations."
    },
    {
      title: "Special Event Gifts",
      image: "/website/Gifts Events/Special Event.jpg",
      description:
        "Custom gifting solutions for weddings, functions, launches and celebrations."
    },
    {
      title: "Premium Snack Hampers",
      image: "/website/Gifts Events/Gift 6.jpg",
      description:
        "Luxury combinations of nuts, dried fruit and treats presented in elegant packaging."
    }
  ],

  didYouKnow: [
    {
      stat: "Ancient Tradition",
      title: "Food As Gifts",
      text: "Food gifts have been part of celebrations for thousands of years, especially during harvests, weddings and festivals."
    },
    {
      stat: "Luxury History",
      title: "Nuts & Dried Fruit",
      text: "Before modern transport, nuts, dried fruit and spices were often considered premium gifts because they travelled well and lasted longer."
    },
    {
      stat: "Memorable",
      title: "Corporate Gifting",
      text: "Thoughtful food gifts are often remembered because they can be shared, enjoyed and associated with appreciation."
    }
  ],

  growingRegions: [
    {
      nut: "Omiyage Gifts",
      regions: ["Japan"]
    },
    {
      nut: "Festive Hampers",
      regions: ["Germany", "South Africa"]
    },
    {
      nut: "Dates & Hospitality",
      regions: ["UAE", "Saudi Arabia"]
    },
    {
      nut: "Harvest Gifts",
      regions: ["Turkey", "Greece"]
    },
    {
      nut: "Corporate Gifts",
      regions: ["USA", "United Kingdom"]
    }
  ],

  nutritionFacts: [
    {
      title: "Shareable",
      value: "Social Snacking",
      description:
        "Snack gifts are easy to share at offices, events, family tables and celebrations."
    },
    {
      title: "Longer Shelf Life",
      value: "Practical Gifting",
      description:
        "Nuts, dried fruit and packaged treats are popular gifts because they store better than many fresh foods."
    },
    {
      title: "Custom Mixes",
      value: "Personal Touch",
      description:
        "Gift packs can be tailored for sweet, savoury, healthy or premium preferences."
    },
    {
      title: "Presentation",
      value: "Gift Experience",
      description:
        "Packaging, colour and variety turn everyday snacks into memorable gifting experiences."
    }
  ],

  learnMore: [
  {
    title: "The Origins of Gift Giving",
    description:
      "Explore why people give gifts and how gifting became part of human relationships and culture.",
    url: "https://www.youtube.com/watch?v=kmLo3KveUMU"
  },
{
  title: "White Day In Japan",
  description:
    "Discover Japan's unique gift-giving tradition where gifts are exchanged one month after Valentine's Day.",
  url: "https://www.youtube.com/watch?v=0hZnv75E3PI"
},
  {
    title: "The History of Christmas Presents",
    description:
      "Learn how Christmas gift-giving traditions developed over time.",
    url: "https://www.youtube.com/watch?v=6lCYmPZRdO0"
  },
  {
    title: "The History of Father's Day",
    description:
      "Discover how Father's Day began and became a celebration of fathers and father figures.",
    url: "https://www.youtube.com/watch?v=uqZvIgNeUsI"
  }
]
},
};

const page = categoryContent[selectedCategoryPage];

    return (
    <div className="brand-website">
      <main className="brand-category-page">
        <button
          type="button"
          className="back-to-website-btn"
          onClick={() => setSelectedCategoryPage(null)}
        >
          ← Back to Website
        </button>
{page.heroImage && (
  <div className="brand-category-hero-image">
    <img src={page.heroImage} alt={page.title} />
  </div>
)}

<p className="brand-eyebrow">{page.eyebrow}</p>
<h1>{page.title}</h1>
<p>{page.description}</p>

       <h2 className="brand-category-section-title">
  Explore The Collection
</h2>

        <div className="brand-category-grid">
          {(page.items || []).map((item) => (
            <div className="brand-category-item" key={item.title}>
              <img
                src={item.image}
                alt={item.title}
                className="brand-category-image"
              />

              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>

        {page.didYouKnow && (
          <section className="brand-info-section">
            <h2>Did You Know?</h2>
            <div className="brand-fact-grid">
              {page.didYouKnow.map((fact) => (
                <div className="brand-fact-card" key={fact.title}>
                  <strong>{fact.stat}</strong>
                  <h3>{fact.title}</h3>
                  <p>{fact.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      {page.growingRegions && (
  <section className="brand-info-section brand-world-section">
        <h2>Around The World</h2>
    <p>
  {page.worldIntro}
</p>

    <div className="brand-region-card-grid">
      {page.growingRegions.map((row) => (
        <div className="brand-region-card" key={row.nut}>
          <h3>{row.nut}</h3>

          <div className="brand-region-tags">
          {row.regions.map((region) => {
  const flags = {
    USA: "https://flagcdn.com/w40/us.png",
    Spain: "https://flagcdn.com/w40/es.png",
    Australia: "https://flagcdn.com/w40/au.png",
    Vietnam: "https://flagcdn.com/w40/vn.png",
    India: "https://flagcdn.com/w40/in.png",
    Africa: "https://flagcdn.com/w40/za.png",
    "South Africa": "https://flagcdn.com/w40/za.png",
    Iran: "https://flagcdn.com/w40/ir.png",
    Turkey: "https://flagcdn.com/w40/tr.png",
    Mexico: "https://flagcdn.com/w40/mx.png",
    Thailand: "https://flagcdn.com/w40/th.png",
    Canada: "https://flagcdn.com/w40/ca.png",
    Egypt: "https://flagcdn.com/w40/eg.png",
    UAE: "https://flagcdn.com/w40/ae.png",
    "Saudi Arabia": "https://flagcdn.com/w40/sa.png",
    Mexico: "https://flagcdn.com/w40/mx.png",
    Argentina: "https://flagcdn.com/w40/ar.png",
    Bolivia: "https://flagcdn.com/w40/bo.png",

    Canada: "https://flagcdn.com/w40/ca.png",
    Russia: "https://flagcdn.com/w40/ru.png",
    China: "https://flagcdn.com/w40/cn.png",

    Ukraine: "https://flagcdn.com/w40/ua.png",

    Sudan: "https://flagcdn.com/w40/sd.png",
    Ethiopia: "https://flagcdn.com/w40/et.png",
    Ghana: "https://flagcdn.com/w40/gh.png",
    "Ivory Coast": "https://flagcdn.com/w40/ci.png",
    Ecuador: "https://flagcdn.com/w40/ec.png",

    Brazil: "https://flagcdn.com/w40/br.png",
    Madagascar: "https://flagcdn.com/w40/mg.png",
    Indonesia: "https://flagcdn.com/w40/id.png",
    Hungary: "https://flagcdn.com/w40/hu.png",
    Romania: "https://flagcdn.com/w40/ro.png",

    "New Zealand": "https://flagcdn.com/w40/nz.png",

    Yemen: "https://flagcdn.com/w40/ye.png",
    "Saudi Arabia": "https://flagcdn.com/w40/sa.png",

    Japan: "https://flagcdn.com/w40/jp.png",
    Germany: "https://flagcdn.com/w40/de.png",
    Greece: "https://flagcdn.com/w40/gr.png",
    "United Kingdom": "https://flagcdn.com/w40/gb.png",
  };

  return (
    <span key={region}>
      <img src={flags[region]} alt="" />
      {region}
    </span>
  );
})}
          </div>
        </div>
      ))}
    </div>
  </section>
)}

        {page.nutritionFacts && (
  <section className="brand-info-section brand-nutrition-card">
    <h2>Nutrition Spotlight</h2>

    <div className="brand-nutrition-grid">
      {page.nutritionFacts.map((fact) => (
        <div className="brand-nutrition-item" key={fact.title}>
          <strong>{fact.value}</strong>
          <h3>{fact.title}</h3>
          <p>{fact.description}</p>
        </div>
      ))}
    </div>
  </section>
)}

 {page.learnMore && (
  <section className="brand-info-section">
    <h2>{page.learnMoreTitle || "Learn More"}</h2>

    <div className="brand-learn-grid">
      {page.learnMore.map((item) => {
        const videoId = item.url ? item.url.split("v=")[1] : "";

        return (
          <div className="brand-learn-card" key={item.title}>
            <div className="brand-learn-image-placeholder">
              {videoId ? (
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt={item.title}
                  className="brand-learn-thumbnail"
                />
              ) : (
                <span>🎥</span>
              )}
            </div>

            <h3>{item.title}</h3>
            <p>{item.description}</p>

            <a
              href={item.url || "#"}
              target="_blank"
              rel="noreferrer"
              className={`brand-learn-btn ${!item.url ? "disabled" : ""}`}
              onClick={(e) => {
                if (!item.url) e.preventDefault();
              }}
            >
              Watch Video
            </a>
          </div>
        );
      })}
    </div>
  </section>
)}
      </main>
    </div>
  );
}
  return (
    <div className="brand-website">
      <header className="brand-nav">
        <div className="brand-nav-logo">
          <img src="/snack-logo.png" alt="The Snack Merchant" />
          <div>
            <strong>The Snack Merchant</strong>
            <span>Artisan Nuts & Goodies</span>
          </div>
        </div>

        <nav className="brand-nav-links">
  <a href="#about">About</a>
  <a href="#products">Products</a>
  <a href="#markets">Markets</a>
  <a href="#contact">Contact</a>

  <button
    type="button"
    onClick={() => {
      setShowShop(true);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    }}
  >
    Shop Online
  </button>
</nav>
      </header>

      <main>
        <section className="brand-hero">
  <img src="/website/hero-banner.jpg" alt="The Snack Merchant premium snacks" />

  <div className="hero-center-logo">
  <img src="/website/SMLogo.jpg" alt="The Snack Merchant logo" />
</div>
</section>

        <section className="brand-hero-cta">
  <p>Premium Nuts • Dried Fruit • Seeds • Gourmet Snacks</p>
  <h1>Quality snacks for everyday orders, markets, offices and gifting.</h1>

  <div className="brand-actions center">
    <button
  type="button"
  onClick={() => {
    setShowShop(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }}
>
      Shop Online
    </button>
   
  </div>
</section>



   <section className="brand-why">
  <p className="brand-eyebrow">Why Choose Us</p>
  <h2>Premium snacks with convenience, quality and trust.</h2>

  <div className="brand-why-grid">
    <div className="brand-why-card">
            <h3>Premium Quality</h3>
      <p>Carefully selected nuts, dried fruit, seeds, treats and gourmet snacks.</p>
    </div>

    <div className="brand-why-card">
           <h3>Nationwide Delivery</h3>
      <p>PUDO locker delivery available across South Africa.</p>
    </div>

    <div className="brand-why-card">
            <h3>Markets & Events</h3>
      <p>Professional market presence for festivals, corporate events and gifting.</p>
    </div>

    <div className="brand-why-card">
            <h3>Trusted Distributor</h3>
      <p>Proud distributor for Crazy Nuts Snacks.</p>
    </div>
  </div>
</section>
<section className="brand-featured">
  <p className="brand-eyebrow">Featured Favourites</p>
  <h2>Our Best Sellers</h2>

 <div className="brand-featured-grid">
  <div className="brand-featured-card">
    <img src="/website/Yogurt Cashews.png" alt="Yoghurt Cashews" />
    <h3>Yoghurt Cashews</h3>
    <p>Creamy yoghurt-coated cashews and one of our most popular sweet treats.</p>
  </div>

  <div className="brand-featured-card">
    <img src="/website/Mixed Nuts.png" alt="Mixed Nuts" />
    <h3>Mixed Nuts</h3>
    <p>A premium nut blend for everyday snacking, sharing and gifting.</p>
  </div>

  <div className="brand-featured-card">
    <img src="/website/Sugar Fruit Cubes.png" alt="Sugar Fruit Cubes" />
    <h3>Sugar Fruit Cubes</h3>
    <p>Colourful fruit cubes, perfect for kids, parties, gifting and sweet snacking.</p>
  </div>

  <div className="brand-featured-card">
    <img src="/website/Cashew peri.jpg" alt="Peri-Peri Cashews" />
    <h3>Peri-Peri Cashews</h3>
    <p>Premium cashews with a bold peri-peri kick for savoury snack lovers.</p>
  </div>
</div>

  <button
    type="button"
    className="brand-featured-btn"
    onClick={() => {
  setShowShop(true);
  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
}}
  >
    View Full Product Range
  </button>
<section className="brand-gifts">
  <div className="brand-gifts-content">
    <p className="brand-eyebrow">Corporate Gifts & Bulk Orders</p>
    <h2>Gift-ready snack packs for teams, clients and events.</h2>
    <p>
      From client thank-you gifts to team snack packs and event hampers, we can
      prepare premium snack selections using nuts, dried fruit, honey and sweet
      treats.
    </p>

    <div className="brand-actions left">
           <button
  type="button"
  onClick={() => {
    setShowShop(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }}
>
  Shop Online
</button>
    </div>
  </div>

  <div className="brand-gifts-gallery">
    <img src="/website/Corporate Gifts 1.jpg.png" alt="Corporate gift pack option 1" />
    <img src="/website/Corporate Gifts 2.jpg.png" alt="Corporate gift pack option 2" />
    <img src="/website/Corporate Gifts 3.jpg.png" alt="Corporate gift pack option 3" />
  </div>
</section>

<section className="brand-trust">
  <p className="brand-eyebrow">WHY CUSTOMERS LOVE US</p>

  <h2>Quality, convenience and trusted service.</h2>

  <div className="brand-trust-grid">

    <div className="brand-trust-card">
      <h3>Premium Ingredients</h3>
      <p>
        Premium nuts, dried fruit, seeds and treats sourced from trusted suppliers.
      </p>
    </div>

    <div className="brand-trust-card">
      <h3>Freshly Packed</h3>
      <p>
        Carefully packed and quality checked before reaching our customers.
      </p>
    </div>

    <div className="brand-trust-card">
      <h3>Markets & Community</h3>
      <p>
        Serving customers online, at markets, festivals and community events across South Africa.
      </p>
    </div>

  </div>
</section>

</section>
       <section id="about" className="brand-section brand-about">
          <div>
            <p className="brand-eyebrow">About The Snack Merchant</p>
            <h2>Quality you can taste, from Centurion to your door.</h2>
            <p>
              The Snack Merchant is a Centurion-based snack business offering premium nuts,
              dried fruit, seeds, trail mixes, chocolate and yoghurt treats, savoury snacks,
              honey and curated gift packs.
            </p>
            <p>
              We proudly supply market customers, households, offices, events and gifting
              orders, with PUDO delivery available nationwide and collection requests in
              Centurion.
            </p>
            <p className="brand-note">Distributor for Crazy Nuts Snacks.</p>
          </div>

          <img src="/website/Snack Merchant Stand Front.jpg" alt="The Snack Merchant market stand" />
        </section>

        <section id="products" className="brand-section brand-products">
          <p className="brand-eyebrow">Product Range</p>
          <h2>Explore our premium snack range</h2>

          <div className="brand-product-grid">
            {productHighlights.map((item) => (
              <button
                type="button"
                key={item.title}
                className="brand-product-card"
onClick={() => {
  const pageMap = {
    "Premium Nuts": "premium-nuts",
    "Dried Fruit": "dried-fruit",
    "Seeds & Health Pantry": "seeds-health",
    "Chocolate & Yoghurt Treats": "chocolate-yoghurt",
    Honey: "honey",
    "Gift Packs & Events": "gift-packs"
  };

  setSelectedCategoryPage(pageMap[item.title]);
  window.scrollTo({ top: 0, behavior: "smooth" });
}}
              >
                <img
                img src={item.image} alt={item.title} />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </section>

      <section id="markets" className="brand-events">
  <p className="brand-eyebrow">Markets & Events</p>
  <h2>Find The Snack Merchant at markets and community events.</h2>

  <h3 className="brand-events-subtitle">Upcoming Markets</h3>

  <div className="brand-events-grid">
    <div className="brand-event-card featured">
      <span>27 June</span>
      <h3>Inside Out Market</h3>
      <p>Lenchen Avenue, Centurion.</p>
    </div>

    <div className="brand-event-card">
      <span>11 July</span>
      <h3>Busstop 7 Market</h3>
      <p>Weekend market event.</p>
    </div>

    <div className="brand-event-card">
      <span>18 July</span>
      <h3>Busstop 7 Market</h3>
      <p>Weekend market event.</p>
    </div>

    <div className="brand-event-card">
      <span>25 July</span>
      <h3>Busstop 7 Market</h3>
      <p>Weekend market event.</p>
    </div>

    <div className="brand-event-card">
      <span>1 Aug</span>
      <h3>Sionspoort Vleisfees Randfontein</h3>
      <p>Community food and market event.</p>
    </div>

    <div className="brand-event-card">
      <span>14–16 Aug</span>
      <h3>Outdoor Expo Broederstroom</h3>
      <p>Outdoor expo and vendor event.</p>
    </div>

    <div className="brand-event-card">
      <span>29 Aug</span>
      <h3>Pierre van Ryneveld Dorpsfees</h3>
      <p>Community market and festival day.</p>
    </div>

    <div className="brand-event-card">
      <span>10 Oct</span>
      <h3>Oktoberfest Randfontein</h3>
      <p>Festival and family market event.</p>
    </div>

    <div className="brand-event-card">
      <span>30–31 Oct</span>
      <h3>Oppidorpfees Bronkhorstspruit</h3>
      <p>Local festival and vendor market.</p>
    </div>

    <div className="brand-event-card">
      <span>13–15 Nov</span>
      <h3>Kersfees is Groot</h3>
      <p>Christmas market and festive gifting event.</p>
    </div>
  </div>

  <h3 className="brand-events-subtitle past">Past Events</h3>

  <div className="brand-events-grid past-events">
    <div className="brand-event-card past">
      <span>29–31 May</span>
      <h3>Afridome Parys</h3>
      <p>Three-day market event in Parys.</p>
    </div>

    <div className="brand-event-card past">
      <span>20–21 June</span>
      <h3>Killarney Golf Club Winter Soiree</h3>
      <p>Premium winter market event.</p>
    </div>
  </div>
  </section>

  <section id="contact" className="brand-contact-forms">
  <p className="brand-eyebrow">Contact</p>
  <h2>Enquiries & Vendor Bookings</h2>
  <p className="brand-contact-intro">
    Send us a general enquiry or invite The Snack Merchant to exhibit at your
    market, festival, school, estate day or corporate event.
  </p>

  <div className="brand-form-grid">
    <form
      className="brand-enquiry-form"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const subject = "General Enquiry - The Snack Merchant";
        const body = `
General Enquiry

Name: ${data.get("name")}
Email: ${data.get("email")}
Cell: ${data.get("cell")}

Message:
${data.get("message")}
        `;
        window.location.href = `mailto:gideonfick@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }}
    >
      <h3>General Enquiry</h3>
      <p>For product questions, bulk orders, gifts, pricing or delivery.</p>

      <input name="name" placeholder="Your name" required />
      <input name="email" type="email" placeholder="Email address" required />
      <input name="cell" placeholder="Cell number" required />
      <textarea name="message" placeholder="How can we help?" rows="5" required />

      <button type="submit">Send General Enquiry</button>
    </form>

    <form
      className="brand-enquiry-form"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const subject = "Vendor Booking Enquiry - The Snack Merchant";
        const body = `
Vendor / Market Booking Enquiry

Contact Person: ${data.get("contactPerson")}
Organisation / Venue: ${data.get("venue")}
Event Name: ${data.get("eventName")}
Event Date: ${data.get("eventDate")}
Expected Visitors: ${data.get("visitors")}
Cell: ${data.get("bookingCell")}
Email: ${data.get("bookingEmail")}

Event Details:
${data.get("eventDetails")}
        `;
        window.location.href = `mailto:gideonfick@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }}
    >
      <h3>Book Us As A Vendor</h3>
      <p>For markets, festivals, schools, estates and corporate events.</p>

      <input name="contactPerson" placeholder="Contact person" required />
      <input name="venue" placeholder="Organisation / venue" required />
      <input name="eventName" placeholder="Event name" required />
      <input name="eventDate" type="date" required />
      <input name="visitors" placeholder="Expected visitors" />
      <input name="bookingCell" placeholder="Cell number" required />
      <input name="bookingEmail" type="email" placeholder="Email address" required />
      <textarea name="eventDetails" placeholder="Tell us about the event" rows="5" required />

      <button type="submit">Send Booking Enquiry</button>
    </form>
  </div>
</section>


<footer className="brand-footer">
  <div>
    <strong>The Snack Merchant</strong>
    <span>Artisan Nuts & Goodies</span>
  </div>

  <p>
    Premium nuts, dried fruit, seeds, honey, treats and gift packs from Centurion, Gauteng.
  </p>

  <p>
    PUDO delivery nationwide • Centurion collection requests • Distributor for Crazy Nuts Snacks
  </p>
</footer>

</main>

      
    </div>
  );
}

 return (
  <div className="app">
    <button
      type="button"
      className="back-to-website-btn"
      onClick={() => setShowShop(false)}
    >
      ← Back to Website
    </button>

    {cartToast && (
      <div className="cart-toast">
        {cartToast}
      </div>
    )}
{showOrderSuccess && (
  <div className="order-success-overlay">
    <div className="order-success-card">
      <h2>
        {orderSuccessType === "payfast"
  ? "Payment Received ✅"
  : orderSuccessType === "collection"
  ? "Collection Request Submitted ✅"
  : "Order Confirmed ✅"}
      </h2>

      {orderSuccessType === "payfast" ? (
  <>
    <p>Thank you. Your payment has been received.</p>
  </>
) : orderSuccessType === "collection" ? (
  <>
    <p>
      Thank you. Your collection request has been received.
    </p>

    <p className="order-success-note compact-popup">
      We will confirm local stock availability before requesting payment.
    </p>
  </>
) : (
  <>
    <div className="eft-details compact-popup">
      <p><span>Bank</span><strong>{EFT_BANK}</strong></p>
      <p><span>Account</span><strong>{EFT_ACCOUNT_NAME}</strong></p>
      <p><span>Account No</span><strong>{EFT_ACCOUNT_NUMBER}</strong></p>
      <p><span>Branch</span><strong>{EFT_BRANCH_CODE}</strong></p>
      <p>
  <span>Reference</span>
  <strong>{orderSuccessNumber}</strong>
</p>
    </div>

    <p className="order-success-note compact-popup">
      Please send proof of payment on WhatsApp.
    </p>
  </>
)}

      <button
        className="order-success-btn"
        onClick={() => {
          setShowOrderSuccess(false);
          resetCheckoutForm();
        }}
      >
        Done / Continue Shopping
      </button>
    </div>
  </div>
)}
<a href="#cart" className="floating-cart">
<span className="cart-icon">🛒</span>
  {cartItemCount > 0 && (
    <span className="cart-badge">
      {cartItemCount}
    </span>
  )}
</a>
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
         
        </div>
      </header>

      {adminView !== "orders" && (
  <>
    <section className="intro">
      <h2>Premium Snacks Delivered</h2>
      <p>
        Browse our full catalog, choose your preferred size and quantity, then
        place your order securely through EFT or PayFast.
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
  </>
)}

      {adminView !== "orders" && (
  <>
    <section className="filters">
     {CUSTOMER_CATEGORIES.map((cat) => (
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
      {[
        "All Stock",
        "In Stock",
        "Low Stock",
        "Available on Order",
        "Seasonal",
      ].map((status) => (
        <button
          key={status}
          onClick={() => setActiveStock(status)}
          className={activeStock === status ? "active" : ""}
        >
          {status}
        </button>
      ))}
    </section>
  </>
)}
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
    Showing {groupedProducts.length} products
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
  <div
  className={`admin-metric-card ${orderDashboardFilter === "all" ? "active" : ""}`}
  onClick={() => setOrderDashboardFilter("all")}
>
    <span>👆 Total Orders</span>
    <strong>
      {
        orders.filter(
          (order) => normalizeOrderStatus(order.order_status) !== "Cancelled"
        ).length
      }
    </strong>
  </div>

  <div className="admin-metric-card">
    <span>Total Sales</span>
    <strong>
      R{
        orders
          .filter((order) =>
            ["Paid", "Collected / Dispatched", "Closed"].includes(
              normalizeOrderStatus(order.order_status)
            )
          )
          .reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
      }
    </strong>
  </div>

  <div
  className={`admin-metric-card ${orderDashboardFilter === "pending" ? "active" : ""}`}
  onClick={() => setOrderDashboardFilter("pending")}
>
 <span>👆 Pending Payment / Stock Confirmation</span>
  <strong>
    {
      orders.filter(
        (order) =>
          ["New Order", "Pending Stock Confirmation", "Awaiting Payment"].includes(
            normalizeOrderStatus(order.order_status)
          ) &&
          normalizeOrderStatus(order.order_status) !== "Cancelled"
      ).length
    }
  </strong>
</div>

<div
  className={`admin-metric-card ${orderDashboardFilter === "paid" ? "active" : ""}`}
  onClick={() => setOrderDashboardFilter("paid")}
>
  <span>👆 Paid Orders</span>
  <strong>
    {
      orders.filter(
        (order) =>
          normalizeOrderStatus(order.order_status) === "Paid" &&
          normalizeOrderStatus(order.order_status) !== "Cancelled"
      ).length
    }
  </strong>
</div>

<div
  className={`admin-metric-card ${orderDashboardFilter === "collection" ? "active" : ""}`}
  onClick={() => setOrderDashboardFilter("collection")}
>
  <span>👆 Collection Orders</span>
  <strong>
    {
      orders.filter(
        (order) =>
          order.order_type === "Collection" &&
          normalizeOrderStatus(order.order_status) !== "Cancelled"
      ).length
    }
  </strong>
</div>

<div
  className={`admin-metric-card ${orderDashboardFilter === "pudo" ? "active" : ""}`}
  onClick={() => setOrderDashboardFilter("pudo")}
>
  <span>👆 PUDO Orders</span>
  <strong>
    {
      orders.filter(
        (order) =>
          order.order_type === "Delivery" &&
          normalizeOrderStatus(order.order_status) !== "Cancelled"
      ).length
    }
  </strong>
</div>

<div
  className={`admin-metric-card ${orderDashboardFilter === "cancelled" ? "active" : ""}`}
  onClick={() => setOrderDashboardFilter("cancelled")}
>
  <span>👆 Cancelled Orders</span>
  <strong>
    {
      orders.filter(
        (order) =>
          normalizeOrderStatus(order.order_status) === "Cancelled"
      ).length
    }
  </strong>
</div>

<div className="admin-metric-card">
  <span>Average Order Value</span>
  <strong>
    R{
      orders.filter(
        (order) =>
          normalizeOrderStatus(order.order_status) !== "Cancelled"
      ).length > 0
        ? Math.round(
            orders
              .filter(
                (order) =>
                  normalizeOrderStatus(order.order_status) !== "Cancelled"
              )
              .reduce(
                (sum, order) => sum + Number(order.total_amount || 0),
                0
              ) /
              orders.filter(
                (order) =>
                  normalizeOrderStatus(order.order_status) !== "Cancelled"
              ).length
          )
        : 0
    }
  </strong>
</div>

</div>
<div className="top-products-card">
  <h3>Top Selling Products</h3>

  {Object.entries(
    orders
      .filter((order) => normalizeOrderStatus(order.order_status) !== "Cancelled")
      .reduce((acc, order) => {
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
<div className="dashboard-filter-summary">
  <span>
    Viewing:{" "}
    {orderDashboardFilter === "all"
      ? "All Active Orders"
      : orderDashboardFilter === "pending"
      ? "Pending Payment / Stock Confirmation"
      : orderDashboardFilter === "paid"
      ? "Paid Orders"
      : orderDashboardFilter === "collection"
      ? "Collection Orders"
      : orderDashboardFilter === "pudo"
      ? "PUDO Orders"
      : orderDashboardFilter === "cancelled"
      ? "Cancelled Orders"
      : "All Active Orders"}{" "}
    ({getDashboardOrders().length})
  </span>

  {orderDashboardFilter !== "all" && (
    <button
      className="clear-dashboard-filter-btn"
      onClick={() => setOrderDashboardFilter("all")}
    >
      Show All Orders
    </button>
  )}
</div>
    {getDashboardOrders().length === 0 ? (
      <p className="no-orders">No orders yet</p>
    ) : (
      <div className="admin-order-cards">
  {getDashboardOrders().map((order) => (
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
       <p>
  <span>Delivery Fee</span>
  {order.order_type === "Collection"
    ? "N/A"
    : `R${order.delivery_fee || 0}`}
</p>
      </div>

      <div className="admin-order-actions">

        <select
          className={`status-select order-${normalizeOrderStatus(order.order_status)
  .toLowerCase()
  .replace(/[\/\s]+/g, "-")}`}
          value={normalizeOrderStatus(order.order_status)}
          style={{
  backgroundColor:
    normalizeOrderStatus(order.order_status) === "Pending Stock Confirmation"
      ? "#b45309"
      : normalizeOrderStatus(order.order_status) === "Collection Approved"
      ? "#1d4ed8"
      : normalizeOrderStatus(order.order_status) === "Converted to PUDO Delivery"
      ? "#7e22ce"
      : normalizeOrderStatus(order.order_status) === "Awaiting Payment"
      ? "#ca8a04"
      : normalizeOrderStatus(order.order_status) === "Paid"
      ? "#15803d"
      : normalizeOrderStatus(order.order_status) === "Ready for Collection"
      ? "#0f766e"
      : normalizeOrderStatus(order.order_status) === "Dispatched"
      ? "#1e3a8a"
      : normalizeOrderStatus(order.order_status) === "Closed"
      ? "#166534"
      : normalizeOrderStatus(order.order_status) === "Cancelled"
      ? "#991b1b"
      : "#111",
  color: "#fff",
  borderColor: "#d9a928",
}}
          onChange={async (e) => {
            const newOrderStatus = e.target.value;

            await axios.patch(
  `${API_BASE_URL}/orders/${order.id}/status`,
  {
    orderStatus: newOrderStatus,
    paymentStatus:
      newOrderStatus === "Paid"
        ? "Paid"
        : newOrderStatus === "Cancelled"
        ? "Cancelled"
        : order.payment_status,
  }
);

            loadOrders();
          }}
        >
         <option style={{ backgroundColor: "#111", color: "#fff" }}>
  New Order
</option>

<option style={{ backgroundColor: "#b45309", color: "#fff" }}>
  Pending Stock Confirmation
</option>

<option style={{ backgroundColor: "#1d4ed8", color: "#fff" }}>
  Collection Approved
</option>

<option style={{ backgroundColor: "#7e22ce", color: "#fff" }}>
  Converted to PUDO Delivery
</option>

<option style={{ backgroundColor: "#ca8a04", color: "#fff" }}>
  Awaiting Payment
</option>

<option style={{ backgroundColor: "#15803d", color: "#fff" }}>
  Paid
</option>

<option style={{ backgroundColor: "#0f766e", color: "#fff" }}>
  Ready for Collection
</option>

<option style={{ backgroundColor: "#1e3a8a", color: "#fff" }}>
  Dispatched
</option>

<option style={{ backgroundColor: "#166534", color: "#fff" }}>
  Closed
</option>

<option style={{ backgroundColor: "#991b1b", color: "#fff" }}>
  Cancelled
</option>
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
    alert("Customer update copied.");
  }}
>
  Copy Customer Update
</button>

<button
  className="copy-confirmation-btn"
  onClick={() => generateInvoicePDF(order)}
>
  Download Invoice
</button>

{normalizeOrderStatus(order.order_status) === "Paid" && (
  <button
    className="copy-confirmation-btn"
    onClick={() => generateReceiptPDF(order)}
  >
    Download Receipt
  </button>
)}


{![
  "Paid",
  "Ready for Collection",
  "Dispatched",
  "Collected / Dispatched",
  "Closed",
  "Cancelled",
  "Payment Failed",
].includes(normalizeOrderStatus(order.order_status)) && (
  <button
    className="copy-confirmation-btn"
    onClick={() => generatePayFastLinkForOrder(order)}
  >
    Generate PayFast Link
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
      <main
  id="products"
  className={isAdmin ? "products admin-products-grid" : "products"}
>
        {groupedProducts.map((product) => (
          <div
            className={`card ${isAdmin ? "admin-product-card" : ""}`}
            key={product.code}
          >
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
                <div className="image-placeholder">No photo yet</div>
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

                  <label>Overall Stock Status</label>

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
                </div>
              )}
            </div>

            <div className="badge">{product.code}</div>

            {!isAdmin ? (
              <div
                className={`stock-badge ${
                  (productStock[product.code] || "In Stock")
                    .toLowerCase()
                    .replaceAll(" ", "-")
                }`}
              >
                {productStock[product.code] || "In Stock"}
              </div>
            ) : null}

            <h3>{product.name}</h3>

            <p className="category">{product.category}</p>
            <p className="description">{product.desc}</p>

            {isAdmin ? (
              <div className="admin-variant-panel">
                <div className="admin-variant-header">
                  <span>Size</span>
                  <span>Wholesale</span>
                  <span>Selling</span>
                  <span>Status</span>
                </div>

                {product.variants.map((variant) => {
                  const key = getPricingKey(variant.code, variant.size);

                  const wholesaleValue =
                    productPricing[key] ??
                    supplierWholesalePrices[key] ??
                    variant.wholesalePrice ??
                    0;

                  const sellingPrice = calculateSellingPrice(
                    Number(wholesaleValue || 0)
                  );

                  const variantStockStatus =
                    productStock[key] ??
                    productStock[variant.code] ??
                    "In Stock";

                  return (
                    <div className="admin-variant-row" key={variant.id}>
                      <strong>{variant.size}</strong>

                      <input
                        className="admin-variant-input"
                        type="number"
                        step="0.01"
                        value={wholesaleValue}
                        onChange={async (e) => {
                          const newWholesale = Number(e.target.value);

                          setProductPricing({
                            ...productPricing,
                            [key]: newWholesale,
                          });

                          try {
                            await axios.post(`${API_BASE_URL}/product-pricing`, {
                              key,
                              wholesalePrice: newWholesale,
                            });
                          } catch (err) {
                            console.error("Failed to save pricing:", err);
                          }
                        }}
                      />

                      <span>R{sellingPrice}</span>

                      <select
                        value={variantStockStatus}
                        onChange={async (e) => {
                          const newStatus = e.target.value;

                          setProductStock({
                            ...productStock,
                            [key]: newStatus,
                          });

                          try {
                            await axios.post(`${API_BASE_URL}/product-stock`, {
                              productCode: key,
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="variant-list">
                {product.variants.map((variant) => {
                  const variantPrice = calculateSellingPrice(
                    productPricing[getPricingKey(variant.code, variant.size)] ??
                      supplierWholesalePrices[
                        getPricingKey(variant.code, variant.size)
                      ] ??
                      variant.wholesalePrice
                  );

                  return (
                    <button
                      type="button"
                      key={variant.id}
                      className="variant-row"
                      onClick={() => addToCart(variant)}
                    >
                      <span>{variant.size}</span>
                      <strong>R{variantPrice}</strong>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </main>

      

      <section id="cart" className="cart">
        <h2>Your Cart</h2>
        {cart.length > 0 && (
  <button
    className="cancel-order-btn"
    onClick={cancelCurrentOrder}
  >
    Cancel Order
  </button>
)}

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

           
          </>
        )}
      </section>
      
    <nav className="floating-side-nav">
  <a href="#products">
    <span className="nav-icon">🌰</span>
    <span>Products</span>
  </a>

  <a href="#search">
    <span className="nav-icon">🔍</span>
    <span>Search</span>
  </a>

  <a href="#cart">
    <span className="nav-icon">🛒</span>
    <span>Cart</span>
  </a>

  <a href="#checkout">
    <span className="nav-icon">💳</span>
    <span>Checkout</span>
  </a>

  <button
    type="button"
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  >
    <span className="nav-icon">🔝</span>
    <span>Top</span>
  </button>
</nav>

<section id="checkout" className="checkout">
        <h2>Checkout Details</h2>
        <div className="checkout-process-notice">
  <h3>⚠️ Important Order Process Notice</h3>

  <p>
    Please read before placing your order.
  </p>

  <ul>
    <li>Centurion Collection requests are subject to local stock availability.</li>
    <li>If local stock is unavailable, orders may be converted to PUDO Locker Delivery.</li>
    <li>PUDO Delivery orders require payment before dispatch.</li>
    <li>Your Order Number must be used as your payment reference.</li>
  </ul>
</div>

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
          <textarea
  className="email-textarea"
  placeholder="Email address (optional — recommended for payment confirmation)"
  value={customer.email}
  onChange={(e) =>
    setCustomer({ ...customer, email: e.target.value })
  }
/>
<p className="checkout-helper-label">
  Select Delivery Method
</p>
          <select
            value={customer.orderType}
            onChange={(e) => {
  const selectedOrderType = e.target.value;

  setCustomer({
    ...customer,
    orderType: selectedOrderType,
    address:
      selectedOrderType === "Delivery"
        ? customer.address
        : "",
  });

  if (selectedOrderType === "Collection") {
    setPaymentMethod("Pay After Confirmation");
  } else {
    setPaymentMethod("EFT / Proof of Payment");
  }
}}
          >
            <option value="Collection">
  Centurion Collection Request
</option>

<option value="Delivery">
  PUDO Locker Delivery
</option>
          </select>
<p className="checkout-helper-label">
  Select Payment Method
</p>

<select
  value={paymentMethod}       
  onChange={(e) => setPaymentMethod(e.target.value)}
>
  {customer.orderType === "Collection" ? (
  <option value="Pay After Confirmation">
    Pay After Stock Confirmation
  </option>
) : (
  <>
    <option value="EFT / Proof of Payment">
      EFT / Proof of Payment
    </option>
    <option value="Pay Online">
      Pay Online with PayFast
    </option>
  </>
)}
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

 <button
  className="checkout-btn"
  onClick={() => {
    if (!validateOrderDetails()) return;
    setShowOrderConfirm(true);
  }}
>
  Checkout
</button>

      </section>

{customer.orderType === "Delivery" &&
  paymentMethod === "EFT / Proof of Payment" && (
  <div className="eft-static-box">
  <h3>EFT Banking Details</h3>
  <p><strong>Bank:</strong> {EFT_BANK}</p>
  <p><strong>Account Name:</strong> {EFT_ACCOUNT_NAME}</p>
  <p><strong>Account Number:</strong> {EFT_ACCOUNT_NUMBER}</p>
  <p><strong>Branch Code:</strong> {EFT_BRANCH_CODE}</p>
  <div className="eft-reference-box">
  <span className="eft-reference-label">Reference:</span>
  <span className="eft-reference-text">
    Use your Order Number as the payment reference. Your Order Number will be provided after checkout.
  </span>
</div>
  <p className="eft-static-note">
    For EFT orders, please send proof of payment via WhatsApp after payment.
  </p>
</div>)}
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
      <h2>
  {customer.orderType === "Collection"
    ? "Review Collection Request"
    : "Review My Order"}
</h2>

      <div className="confirm-customer-details">
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>Phone:</strong> {customer.phone}</p>
        <p>
  <strong>Order Type:</strong>{" "}
  {customer.orderType === "Collection"
    ? "Centurion Collection Request"
    : "PUDO Locker Delivery"}
</p>
        <p>
  <strong>Payment Status:</strong>{" "}
  {customer.orderType === "Collection"
    ? "Payment after stock confirmation"
    : paymentMethod}
</p>

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
          Back to Checkout
        </button>
        <button
  className="cancel-order-btn"
  onClick={cancelCurrentOrder}
>
  Cancel Order
</button>

        {paymentMethod === "EFT / Proof of Payment" && (
  <button
    className="confirm-send-btn"
    onClick={() => {
      setShowOrderConfirm(false);
      submitEftOrder();
    }}
  >
    {customer.orderType === "Collection"
  ? "Submit Collection Request"
  : "Proceed With Order"}
  </button>
)}

{customer.orderType === "Delivery" &&
  paymentMethod === "Pay Online" && (
  <button
    className="confirm-payfast-btn"
    onClick={() => {
      setShowOrderConfirm(false);
      payWithPayFast();
    }}
  >
    Place Order & Pay with PayFast
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

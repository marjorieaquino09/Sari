import { db } from "./firebase-config.js";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function checkAndSeedDefaultProducts(userId) {
  try {
    
    const q = query(
      collection(db, "products"), 
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);

    
    if (snap.empty) {
      const defaultProducts = [
        // === HOUSEHOLD ===
        ['Sisters Sanitary Pad', 'Household', 38.00, 15, 'sist.jpg'],
        ['Modess Sanitary Napkin 8s', 'Household', 45.00, 15, 'mod.jpg'],
        ['Scotch Brite Sponge', 'Household', 25.00, 15, 'sb.jpg'],
        ['Katol (Mosquito Coil)', 'Household', 22.00, 20, 'kat.jpg'],
        ['Zonrox Bleach 250ml', 'Household', 22.00, 15, 'zon.jpg'],
        ['Champion Bar Soap', 'Household', 28.00, 25, 'champ.jpg'],
        ['Downy Fabric Conditioner Sachet', 'Household', 8.00, 50, 'down.jpg'],
        ['Sunsilk Shampoo Sachet', 'Household', 7.00, 50, 'suns.jpg'],
        ['Colgate Toothpaste Small', 'Household', 24.00, 20, 'colg.jpg'],
        ['Creamsilk Conditioner Sachet', 'Household', 8.00, 50, 'cream.jpg'],
        ['Palmolive Shampoo Sachet', 'Household', 7.00, 50, 'palm.jpg'],
        ['Safeguard Bar Soap White', 'Household', 32.00, 25, 'safe.jpg'],

        // === BEVERAGE ===
        ['Gatorade Blue Bolt', 'Beverage', 40.00, 15, 'gat.jpg'],
        ['Zesto Juice Orange', 'Beverage', 10.00, 30, 'zes_o.jpg'],
        ['Zesto Juice Apple', 'Beverage', 10.00, 30, 'zes_a.jpg'],
        ['Sprite 1.5L', 'Beverage', 72.00, 10, 'spr_15.jpg'],
        ['Royal 1.5L', 'Beverage', 72.00, 10, 'roy_15.jpg'],
        ['Nature\'s Spring 500ml', 'Beverage', 12.00, 40, 'nat.jpg'],
        ['C2 Apple 500ml', 'Beverage', 25.00, 25, 'c2_a.jpg'],
        ['Sting Energy Drink', 'Beverage', 25.00, 30, 'sti.jpg'],
        ['Coke 500ml', 'Beverage', 35.00, 24, 'cok.jpg'],

        // === CANNED ===
        ['Hunt\'s Pork and Beans', 'Canned', 0.00, 0, 'hun.jpg'],
        ['Young\'s Town Sardines', 'Canned', 26.00, 20, 'yt.jpg'],
        ['San Marino Corned Tuna', 'Canned', 35.00, 20, 'sm_tuna.jpg'],
        ['CDO Carne Norte', 'Canned', 28.00, 15, 'cdo.jpg'],
        ['Purefoods Corned Beef', 'Canned', 55.00, 12, 'pf.jpg'],
        ['Argentina Meat Loaf', 'Canned', 25.00, 18, 'arg_ml.jpg'],
        ['Argentina Corned Beef', 'Canned', 32.00, 15, 'arg_cb.jpg'],
        ['Century Tuna Hot & Spicy', 'Canned', 39.00, 15, 'cen_spi.jpg'],
        ['Century Tuna Flakes in Oil', 'Canned', 38.00, 15, 'cen_oil.jpg'],
        ['Ligo Sardines Red', 'Canned', 29.00, 15, 'lgr.jpg'],
        ['Ligo Sardines Green', 'Canned', 29.00, 15, 'lgg.jpg'],
        ['Mega Sardines Chili', 'Canned', 31.00, 15, 'meg_chi.jpg'],

        // === ALCOHOL ===
        ['Hunter\'s Dry Gin', 'Alcohol', 80.00, 15, 'hunt.jpg'],
        ['Fundador Light 750ml', 'Alcohol', 450.00, 6, 'fund.jpg'],
        ['Ginebra San Miguel Gin 350ml', 'Alcohol', 75.00, 20, 'gsm.jpg'],
        ['Emperador Light Brandy 750ml', 'Alcohol', 150.00, 12, 'emp.jpg'],

        // === COFFEE & TEA ===
        ['Milo Champion 3in1', 'Coffee & Tea', 12.00, 30, 'mil_c.jpg'],
        ['Quaker Oats Instant Sachet', 'Coffee & Tea', 12.00, 25, 'qua.jpg'],
        ['Bear Brand Powdered Milk Sachet', 'Coffee & Tea', 0.00, 0, 'bb.jpg'],
        ['Energen Vanilla', 'Coffee & Tea', 10.00, 0, 'ene.jpg'],
        ['Milo Sachet 24g', 'Coffee & Tea', 12.00, 40, 'mil.jpg'],
        ['Nescafe Creamy White', 'Coffee & Tea', 9.00, 50, 'nes_c.jpg'],
        ['Nescafe Original 3in1', 'Coffee & Tea', 8.50, 50, 'nes_o.jpg'],
        ['Kopiko Brown Coffee', 'Coffee & Tea', 9.00, 50, 'kop_b.jpg'],
        ['Kopiko Blanka 3in1', 'Coffee & Tea', 9.00, 50, 'kop.jpg'],
        ['Great Taste White 3in1', 'Coffee & Tea', 8.00, 50, 'gt.jpg'],


        ['Lemon Square Cheese Cupcake', 'Biscuits', 10.00, 20, 'lem.jpg'],
        ['Choco Mucho Cookie', 'Biscuits', 12.00, 25, 'cmc.jpg'],
        ['Magic Flakes Choco', 'Biscuits', 8.00, 35, 'mf_c.jpg'],
        ['Cream-O Vanilla', 'Biscuits', 9.00, 30, 'cre.jpg'],
        ['Criss Cross Crackers', 'Biscuits', 8.00, 30, 'cc.jpg'],
        ['Presto Peanut Butter', 'Biscuits', 8.00, 35, 'pre.jpg'],
        ['Hansel Butter', 'Biscuits', 8.00, 35, 'han.jpg'],
        ['Rebisco Chocolate Sandwich', 'Biscuits', 8.00, 35, 'reb_c.jpg'],
        ['Rebisco Crackers', 'Biscuits', 7.00, 40, 'reb.jpg'],
        ['Fita Crackers', 'Biscuits', 9.00, 35, 'fit.jpg'],
        ['SkyFlakers Crackers', 'Biscuits', 8.00, 40, 'sky.jpg'],

        
        ['Ding Dong Mixed Nuts', 'Chips', 18.00, 20, 'dd.jpg'],
        ['Nagaraya Peanut Garlic', 'Chips', 20.00, 20, 'nag.jpg'],
        ['Boy Bawang Cornick', 'Chips', 12.00, 30, 'boy.jpg'],
        ['Cracklings Salt & Vinegar', 'Chips', 10.00, 25, 'cra.jpg'],
        ['Patata', 'Chips', 12.00, 20, 'pat.jpg'],
        ['Nova Lick \'n Chips', 'Chips', 25.00, 15, 'nov.jpg'],
        ['Mr. Chips', 'Chips', 12.00, 25, 'mrc.jpg'],
        ['Piattos Cheese', 'Chips', 20.00, 25, 'pia.jpg'],

        
        ['Crispy Fry Breading Mix', 'Condiments', 20.00, 25, 'cris.jpg'],
        ['Mama Sita Sinigang Mix', 'Condiments', 25.00, 25, 'mam.jpg'],
        ['Knorr Liquid Seasoning', 'Condiments', 35.00, 15, 'kno.jpg'],
        ['Ajinomoto Umami Seasoning 50g', 'Condiments', 15.00, 30, 'aji.jpg'],
        ['Magic Sarap All-In-One Seasoning', 'Condiments', 6.00, 50, 'mag.jpg'],
        ['Papa Banana Catsup', 'Condiments', 28.00, 18, 'pap.jpg'],
        ['Silver Swan Vinegar', 'Condiments', 20.00, 20, 'ss_v.jpg'],
        ['Silver Swan Soy Sauce 350ml', 'Condiments', 22.00, 20, 'ss_s.jpg'],
        ['Datu Puti Vinegar 350ml', 'Condiments', 20.00, 20, 'dp_v.jpg'],
        ['Datu Puti Soy Sauce 350ml', 'Condiments', 22.00, 20, 'dp_s.jpg'],
        ['Mang Tomas Siga Lechon Sauce', 'Condiments', 25.00, 20, 'mt.jpg']
      ];

      
      const batch = writeBatch(db);

      defaultProducts.forEach((prod) => {
        const newDocRef = doc(collection(db, "products"));
        batch.set(newDocRef, {
          userId: userId,
          name: prod[0],
          category: prod[1],
          price: Number(prod[2]),
          stock: Number(prod[3]),
          image: prod[4], 
          createdAt: serverTimestamp()
        });
      });

      
      await batch.commit();
      console.log("Default products seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding default products:", error);
  }
}
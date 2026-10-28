// Point d'interrogation météo par spot. Les coordonnées désignent un secteur côtier,
// pas un point de déferlement : les plages à bancs mobiles restent approximatives.
// Les URL ci-dessous documentent l'identification et/ou le point publié.
const coordinates = [
  ['La Côte des Basques', 43.479105, -1.558429, 'documented', 'https://www.cirkwi.com/fr/point-interet/879765-spot-de-la-cote-des-basques'],
  ['Hossegor - La Gravière', 43.671291, -1.441960, 'approximate', 'https://carte-soorts.hossegor.fr/poi/19813/details'],
  ['Les Cavaliers', 43.520800, -1.526650, 'documented', 'https://www.tourisme64.com/sur-place/activites/anglet/LOIAQU064FS000C5-plage-des-cavaliers/'],
  ['Hossegor — La Nord', 43.667000, -1.444400, 'approximate', 'https://www.swelly-surf.com/surf-report/landes/soorts-hossegor/la-nord'],
  ['Seignosse — Les Estagnots', 43.687190, -1.439657, 'documented', 'https://cartelandes.com/poi/55434/details'],
  ['Seignosse — Les Bourdaines', 43.693640, -1.438423, 'documented', 'https://cartelandes.com/poi/55435/details'],
  ['Capbreton — La Piste', 43.641074, -1.447461, 'documented', 'https://cartelandes.com/poi/55427/details'],
  ['Mimizan-Plage', 44.217144, -1.291405, 'approximate', 'https://www.ceveo.com/wp-content/uploads/Carnet-de-sejour-ETE-2024-MIMIZAN-PLAGE.pdf'],
  ['Biscarrosse-Plage', 44.448738, -1.253857, 'approximate', 'https://cartelandes.com/poi/53189/details'],
  ['Lacanau-Océan', 44.990961, -1.200706, 'approximate', 'https://www.researchgate.net/publication/324601505_Etude_des_releves_d%27especes_indicatrices_de_la_qualite_biologique_d%27une_centaine_de_plages_sur_la_cote_aquitaine_Gironde_et_Landes'],
  ['Le Porge', 44.892437, -1.214312, 'approximate', 'https://leporge.com/surf-le-porge/'],
  ['Carcans-Plage', 45.090466, -1.189543, 'approximate', 'https://www.researchgate.net/publication/324601505_Etude_des_releves_d%27especes_indicatrices_de_la_qualite_biologique_d%27une_centaine_de_plages_sur_la_cote_aquitaine_Gironde_et_Landes'],
  ['Hourtin-Plage', 45.225676, -1.169697, 'approximate', 'https://www.researchgate.net/publication/324601505_Etude_des_releves_d%27especes_indicatrices_de_la_qualite_biologique_d%27une_centaine_de_plages_sur_la_cote_aquitaine_Gironde_et_Landes'],
  ['Le Grand Crohot', 44.797650, -1.233310, 'approximate', 'https://onsebaigne.fr/nouvelle-aquitaine/gironde/lege-cap-ferret/le-grand-crohot-033002063'],
  ['La Côte Sauvage', 45.708217, -1.242833, 'approximate', 'https://www.wavesafari.com/cote-sauvage-le-46/'],
  ['Les Grenettes', 46.158217, -1.358467, 'approximate', 'https://www.wavesafari.com/ile-de-re-les-grenettes/'],
  ['La Sauzaie', 46.637700, -1.894100, 'documented', 'https://www.swelly-surf.com/surf-report/vendee/bretignolles-sur-mer'],
  ['Bud Bud', 46.381700, -1.488900, 'approximate', 'https://www.swelly-surf.com/surf-report/vendee/longeville-sur-mer/le-bud-bud'],
  ['La Torche', 47.839705, -4.352089, 'documented', 'https://llestandi.github.io/surf/surf_spots/la_torche/'],
  ['Guidel-Plages', 47.754000, -3.515000, 'approximate', 'https://www.yosurf.app/fr/spot/guidel'],
  ['Le Minou', 48.340170, -4.615230, 'documented', 'https://www.cartes-2-france.com/sport/E001I292120024/site-de-surf-du-minou.php'],
  ['La Palue', 48.202000, -4.555000, 'approximate', 'https://www.swelly-surf.com/surf-report/bretagne/crozon/la-palue'],
]

module.exports = Object.fromEntries(coordinates.map(([name, latitude, longitude, precision, source]) => [
  name,
  { latitude, longitude, precision, source },
]))

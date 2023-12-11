
// load data
let promises = [
    d3.json("data/musicOset_genre_centric_clean.json"),
    d3.json("data/musicOset_artist_centric_clean.json"),
    d3.json("data/musicOset_song_centric_clean.json"),
    d3.json("data/musicOset_acoustic_features.json"),
    d3.json("data/MBTI.json"),
    d3.json("data/mbti_music_data_clean.json"),
    d3.json("data/mbti_music_data_clean_pivot.json"),

    //paper data
    d3.json('data/papers.json'),

    //MAP data
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
    d3.csv("data/MBTI_Countries.csv")

];

Promise.all(promises)
    .then(function (data) {
        createVis(data)
    })
    .catch(function (err) {
        console.log(err)
    });

// init main page
function createVis(data) {

    // musicOset data
    let genreData = data[0],
        artistData = data[1],
        songData = data[2],
        acousticsData = data[3];

    // create genre visualization instance
    let genreVis = new GenreVis("genre_vis", genreData, artistData, songData, acousticsData);

    // MBTI description data
    let mbtiDescData = data[4];

    // create MBTI visualization instance
    let mbtiAll = new mbtiAllVis("mbtiAll", mbtiDescData);
    let mbtiDetail = new mbtiDetailVis("mbtiDetail", mbtiDescData);

    // MBTI test data
    let mbtiTestData = data[5]

    // create test instance
    let testSelect = new TestSelection("test_select", mbtiTestData, genreData);

    // create music distribution instance
    let mbtiMusicData = data[6];
    let mbtiMusicDistribution = new mbtiMusicDistributionVis("mbtiMusicDistribution", mbtiDescData, mbtiMusicData);

    //create papers data
    let papersData = data[7];
    let papersVis = new PapersVis("papers_vis", papersData);

    // MAP data
    let geoData = data[8];
    let mbtiMapData = data[9];
    let mbtiMap = new mbtiMapVis("mbtiMap", mbtiDescData, geoData, mbtiMapData);


}
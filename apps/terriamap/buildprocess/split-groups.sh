SOURCE=datasources/00_National_Data_Sets.json
OUTDIR=datasources/00_National_Data_Sets

if [[ -z `which jq` ]]; then
  echo "You need to install jq, in order to use this. Try one of: "
  echo "  sudo apt-get install jq"
  echo "  sudo brew install jq"
  exit
fi


echo  "Replacing files in ${OUTDIR}/ with individual groups split from $SOURCE" 

read -p "Continue? (Y/N)" choice
echo
case "$choice" in
    y|Y ) ;;
    * ) exit ;;
esac

mkdir -p "$OUTDIR"
rm "$OUTDIR"/*.json
    
i=0
while true; do
  name=`jq -r ".catalog[0].items[$i].name" < "$SOURCE"`
  if [[ $name == "null" ]]; then
    exit
  fi
  name="00_`printf "%02d" $i`_${name// /_}.json"
  echo $name
  jq ".catalog=([.catalog[0]|.items = [.items[$i]]])" < "$SOURCE" > "$OUTDIR/$name"
  ((i++))

done
rm "$SOURCE"
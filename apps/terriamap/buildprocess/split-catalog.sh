SOURCE=wwwroot/init/nm.json
OUTDIR=datasources

if [[ -z `which jq` ]]; then
  echo "You need to install jq, in order to use this. Try one of: "
  echo "  sudo apt-get install jq"
  echo "  sudo brew install jq"
  exit
fi


echo  "Splitting $SOURCE into individual files in ${OUTDIR}/" 

read -p "Continue? (Y/N)" choice
echo
case "$choice" in
    y|Y ) ;;
    * ) exit ;;
esac

mkdir -p $OUTDIR
   
jq "del(.catalog)" < $SOURCE > $OUTDIR/000_settings.json

i=0
while true; do
  name=`jq -r ".catalog[$i].name" < $SOURCE`
  if [[ $name == "null" ]]; then
    exit
  fi
  name=`printf "%02d" $i`_${name// /_}.json
  echo $name
  jq "{catalog:([.catalog[$i]])}" < $SOURCE > $OUTDIR/$name
  ((i++))

done

fi

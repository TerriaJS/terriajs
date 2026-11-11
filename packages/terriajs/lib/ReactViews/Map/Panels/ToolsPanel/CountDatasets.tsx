import { observer } from "mobx-react";
import { FC, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  applyTranslationIfExists,
  TRANSLATE_KEY_PREFIX
} from "../../../../Language/languageHelpers";
import CatalogMemberMixin from "../../../../ModelMixins/CatalogMemberMixin";
import GroupMixin from "../../../../ModelMixins/GroupMixin";
import ReferenceMixin from "../../../../ModelMixins/ReferenceMixin";
import Loader from "../../../Loader";
import { useViewState } from "../../../Context";
import Styles from "./tools-panel.scss";

// let countValue = 1;

interface CounterStats {
  name?: string;
  groups: number;
  members: number;
  messages: string[];
  subTotals: CounterStats[];
}

type GroupAndMember = GroupMixin.Instance & CatalogMemberMixin.Instance;

interface CountDatasetsProps {
  updateResults: (results: ReactNode) => void;
}

const CountDatasets: FC<CountDatasetsProps> = observer((props) => {
  const [btnStringOrComponent, setBtnStringOrComponent] = useState<
    string | JSX.Element
  >(`${TRANSLATE_KEY_PREFIX}countDatasets.btnText`);
  const { t, i18n } = useTranslation();
  const viewState = useViewState();

  const countDatasets = () => {
    const totals: CounterStats & { showResults: boolean } = {
      name: undefined,
      groups: 0,
      members: 0,
      messages: [],
      subTotals: [],
      showResults: false
    };

    function counter(
      group: GroupAndMember,
      stats: CounterStats,
      path: string[]
    ): Promise<void> {
      stats.name = group.name;

      const promises = group.memberModels.map(async (model) => {
        // Not pure - updates stats object & path
        let member = model;
        if (ReferenceMixin.isMixedInto(member)) {
          (await member.loadReference()).ignoreError();
          if (!member.target) {
            return;
          }
          member = member.target;
        }
        if (!CatalogMemberMixin.isMixedInto(member)) return;
        // if (member.countValue === countValue) {
        //   continue;
        // }
        // member.countValue = countValue;
        if (GroupMixin.isMixedInto(member)) {
          const childStats: CounterStats = {
            name: undefined,
            groups: 0,
            members: 0,
            messages: [],
            subTotals: []
          };

          path.push(member.name!);

          const loadPromise = member.loadMembers();
          const countPromise = member.isLoading
            ? loadPromise
                .then((result) => result.throwIfError())
                .then(
                  recurseAndUpdateTotals.bind(
                    undefined,
                    member,
                    stats,
                    childStats,
                    path.slice()
                  )
                )
                .catch(
                  reportLoadError.bind(undefined, member, stats, path.slice())
                )
            : recurseAndUpdateTotals(member, stats, childStats, path);
          path.pop();
          return countPromise;
        } else {
          ++stats.members;
        }
      });
      return Promise.all(promises).then(() => {});
    }

    function recurseAndUpdateTotals(
      member: GroupAndMember,
      stats: CounterStats,
      childStats: CounterStats,
      path: string[]
    ) {
      const promise = counter(member, childStats, path).then(function () {
        stats.groups += childStats.groups + 1;
        stats.members += childStats.members;
        stats.messages.push(...childStats.messages);
        stats.subTotals.push(childStats);
      });
      return promise;
    }

    function reportLoadError(
      _member: GroupAndMember,
      stats: CounterStats,
      path: string[]
    ) {
      stats.messages.push(
        path.join(" -> ") + t(($) => $.countDatasets.loadError)
      );
    }

    setBtnStringOrComponent(
      <Loader message={t(($) => $.countDatasets.countingMessage)} />
    );

    // ++countValue;

    const root = viewState.terria.catalog.group;

    counter(root as GroupAndMember, totals, []).then(function () {
      setBtnStringOrComponent(`${TRANSLATE_KEY_PREFIX}countDatasets.recount`);

      props.updateResults(
        <>
          <div>
            {t(($) => $.countDatasets.totals, {
              items: totals.members,
              groups: totals.groups
            })}
          </div>
          {totals.subTotals.map((subTotal, i) => (
            <div key={i}>
              {t(($) => $.countDatasets.subTotals, {
                name: subTotal.name,
                items: subTotal.members,
                groups: subTotal.groups
              })}
            </div>
          ))}
          <div>&nbsp;</div>
          {totals.messages.map((message, i) => (
            <div key={i}>{message}</div>
          ))}
        </>
      );
    });
  };
  return (
    <form>
      {t(($) => $.countDatasets.title)}
      <button
        className={Styles.submit}
        onClick={countDatasets}
        type="button"
        value={t(($) => $.countDatasets.btnCount) as string}
      >
        {typeof btnStringOrComponent === "string"
          ? applyTranslationIfExists(btnStringOrComponent, i18n)
          : btnStringOrComponent}
      </button>
    </form>
  );
});

export default CountDatasets;

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = { name : Text };

  type OldDayEntry = {
    date : Text; trained : Bool; muscleGroups : [Text];
    creatine : Bool; protein : Bool;
  };

  type DayEntryV2 = {
    date : Text; trained : Bool; restDay : Bool;
    muscleGroups : [Text]; creatine : Bool; protein : Bool;
  };

  public type DayEntry = {
    date : Text; trained : Bool; restDay : Bool;
    muscleGroups : [Text]; creatine : Bool; protein : Bool;
    creatineGrams : Nat; proteinGrams : Nat;
  };

  public type HydrationRecord = { date : Text; totalMl : Nat };

  module DayEntry {
    public func compare(e1 : DayEntry, e2 : DayEntry) : Order.Order {
      Text.compare(e1.date, e2.date);
    };
  };

  module HydrationRecord {
    public func compareDesc(a : HydrationRecord, b : HydrationRecord) : Order.Order {
      switch (Text.compare(a.date, b.date)) {
        case (#less) { #greater };
        case (#greater) { #less };
        case (#equal) { #equal };
      };
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let userEntries = Map.empty<Principal, Map.Map<Text, OldDayEntry>>();
  let userEntriesV2 = Map.empty<Principal, Map.Map<Text, DayEntryV2>>();
  let userEntriesV3 = Map.empty<Principal, Map.Map<Text, DayEntry>>();
  let hydrationGoals = Map.empty<Principal, Nat>();
  let hydrationIntake = Map.empty<Principal, Map.Map<Text, Nat>>();

  system func postupgrade() {
    for ((principal, oldUserMap) in userEntries.entries()) {
      let v2Map : Map.Map<Text, DayEntryV2> = switch (userEntriesV2.get(principal)) {
        case (?existing) { existing };
        case null {
          let m = Map.empty<Text, DayEntryV2>();
          userEntriesV2.add(principal, m);
          m;
        };
      };
      for ((date, old) in oldUserMap.entries()) {
        switch (v2Map.get(date)) {
          case null {
            v2Map.add(date, {
              date = old.date; trained = old.trained; restDay = false;
              muscleGroups = old.muscleGroups; creatine = old.creatine; protein = old.protein;
            });
          };
          case _ {};
        };
      };
    };

    for ((principal, v2UserMap) in userEntriesV2.entries()) {
      let v3Map : Map.Map<Text, DayEntry> = switch (userEntriesV3.get(principal)) {
        case (?existing) { existing };
        case null {
          let m = Map.empty<Text, DayEntry>();
          userEntriesV3.add(principal, m);
          m;
        };
      };
      for ((date, v2) in v2UserMap.entries()) {
        switch (v3Map.get(date)) {
          case null {
            v3Map.add(date, {
              date = v2.date; trained = v2.trained; restDay = v2.restDay;
              muscleGroups = v2.muscleGroups; creatine = v2.creatine; protein = v2.protein;
              creatineGrams = 0; proteinGrams = 0;
            });
          };
          case _ {};
        };
      };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) Runtime.trap("Unauthorized");
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func saveDayEntry(
    date : Text, trained : Bool, restDay : Bool,
    muscleGroups : [Text], creatine : Bool, protein : Bool,
    creatineGrams : Nat, proteinGrams : Nat
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let entry : DayEntry = { date; trained; restDay; muscleGroups; creatine; protein; creatineGrams; proteinGrams };
    let userMap = switch (userEntriesV3.get(caller)) {
      case (null) { let m = Map.empty<Text, DayEntry>(); userEntriesV3.add(caller, m); m };
      case (?m) { m };
    };
    userMap.add(date, entry);
  };

  public query ({ caller }) func getDayEntry(date : Text) : async ?DayEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    switch (userEntriesV3.get(caller)) {
      case (null) { null };
      case (?m) { m.get(date) };
    };
  };

  public query ({ caller }) func getAllEntries() : async [DayEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    switch (userEntriesV3.get(caller)) {
      case (null) { [] };
      case (?m) { m.values().toArray().sort() };
    };
  };

  public shared ({ caller }) func saveHydrationGoal(goalMl : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    hydrationGoals.add(caller, goalMl);
  };

  public query ({ caller }) func getHydrationGoal() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    switch (hydrationGoals.get(caller)) {
      case (?goal) { goal };
      case null { 0 };
    };
  };

  public shared ({ caller }) func addWaterIntake(date : Text, amount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    let userMap = switch (hydrationIntake.get(caller)) {
      case (null) { let m = Map.empty<Text, Nat>(); hydrationIntake.add(caller, m); m };
      case (?m) { m };
    };
    let current = switch (userMap.get(date)) { case (?v) { v }; case null { 0 } };
    let newTotal = current + amount;
    userMap.add(date, newTotal);
    newTotal;
  };

  public query ({ caller }) func getWaterIntake(date : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    switch (hydrationIntake.get(caller)) {
      case (null) { 0 };
      case (?m) { switch (m.get(date)) { case (?v) { v }; case null { 0 } } };
    };
  };

  public query ({ caller }) func getHydrationHistory() : async [HydrationRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) Runtime.trap("Unauthorized");
    switch (hydrationIntake.get(caller)) {
      case (null) { [] };
      case (?m) {
        let hydRecords = m.entries().toArray().map(func((date, totalMl) : (Text, Nat)) : HydrationRecord {
          { date; totalMl };
        });
        hydRecords.sort(HydrationRecord.compareDesc);
      };
    };
  };
};
